param([int]$Port = 4173)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath($PSScriptRoot)
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

public static class PsychologyJanePreviewServer {
    private static readonly HashSet<string> Pages = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
        "news.html", "index.html", "index.jane.html", "booking.html", "events.html", "packages.html", "cart.html",
        "account.html", "page.html", "login.html", "admin/index.html", "tessellate-custom.css", "tessellate-custom.js"
    };
    private static readonly Dictionary<string, string> Mime = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
        {".json", "application/json; charset=utf-8"}, {".html", "text/html; charset=utf-8"}, {".css", "text/css; charset=utf-8"}, {".js", "text/javascript; charset=utf-8"},
        {".png", "image/png"}, {".jpg", "image/jpeg"}, {".webp", "image/webp"}, {".svg", "image/svg+xml"},
        {".woff2", "font/woff2"}, {".woff", "font/woff"}, {".ttf", "font/ttf"}, {".eot", "application/vnd.ms-fontobject"}
    };
    public static void Run(string root, int port) {
        ThreadPool.SetMinThreads(8, 8);
        var listener = new TcpListener(IPAddress.Loopback, port);
        listener.Start();
        Console.WriteLine("Local preview: http://localhost:" + port + "/");
        try {
            while (true) {
                TcpClient client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(delegate(object state) { Serve((TcpClient)state, root); }, client);
            }
        } finally { listener.Stop(); }
    }
    private static void Serve(TcpClient client, string root) {
        using (client) {
            try {
                client.NoDelay = true;
                client.ReceiveTimeout = 3000;
                client.SendTimeout = 10000;
                using (NetworkStream stream = client.GetStream())
                using (var reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true)) {
                    string first = reader.ReadLine();
                    if (String.IsNullOrEmpty(first)) return;
                    string[] parts = first.Split(' ');
                    if (parts.Length < 2 || first.Length > 4096) { Error(client.Client, "400 Bad Request"); return; }
                    var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    string line;
                    int count = 0;
                    while (!String.IsNullOrEmpty(line = reader.ReadLine())) {
                        if (++count > 100 || line.Length > 8192) { Error(client.Client, "400 Bad Request"); return; }
                        int colon = line.IndexOf(':');
                        if (colon > 0) headers[line.Substring(0, colon)] = line.Substring(colon + 1).Trim();
                    }
                    bool head = parts[0] == "HEAD";
                    if (parts[0] != "GET" && !head) { Error(client.Client, "405 Method Not Allowed"); return; }
                    string relative = Uri.UnescapeDataString(parts[1].Split('?')[0]).TrimStart('/');
                    if (relative.Length == 0 || relative.EndsWith("/")) relative += "index.html";
                    bool allowed = Pages.Contains(relative) || relative.StartsWith("platform/", StringComparison.OrdinalIgnoreCase)
                        || relative.StartsWith("html5up-tessellate/", StringComparison.OrdinalIgnoreCase);
                    string file = Path.GetFullPath(Path.Combine(root, relative.Replace('/', Path.DirectorySeparatorChar)));
                    string type;
                    if (!allowed || !file.StartsWith(root.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
                        || !Mime.TryGetValue(Path.GetExtension(file), out type) || !File.Exists(file)) {
                        Error(client.Client, "404 Not Found"); return;
                    }
                    var info = new FileInfo(file);
                    string etag = "\"" + info.Length.ToString("x") + "-" + info.LastWriteTimeUtc.Ticks.ToString("x") + "\"";
                    string cache = Path.GetFileNameWithoutExtension(file).EndsWith("-optimized", StringComparison.OrdinalIgnoreCase)
                        ? "public, max-age=604800" : "no-cache";
                    string previous;
                    if (headers.TryGetValue("If-None-Match", out previous) && previous == etag) {
                        Send(client.Client, "304 Not Modified", type, null, 0, cache, etag, info.LastWriteTimeUtc.ToString("R"), true);
                        return;
                    }
                    byte[] body = head ? null : File.ReadAllBytes(file);
                    Send(client.Client, "200 OK", type, body, info.Length, cache, etag, info.LastWriteTimeUtc.ToString("R"), head);
                }
            } catch { /* A disconnected or idle client must not block other requests. */ }
        }
    }
    private static void Error(Socket socket, string status) {
        byte[] body = Encoding.UTF8.GetBytes(status);
        Send(socket, status, "text/plain; charset=utf-8", body, body.Length, "no-store", null, null, false);
    }
    private static void SendBytes(Socket socket, byte[] data) {
        int offset = 0;
        while (offset < data.Length) {
            int sent = socket.Send(data, offset, Math.Min(32768, data.Length - offset), SocketFlags.None);
            if (sent <= 0) throw new IOException("The client disconnected during the response.");
            offset += sent;
        }
    }
    private static void Send(Socket socket, string status, string type, byte[] body, long length, string cache, string etag, string modified, bool head) {
        var header = new StringBuilder("HTTP/1.1 " + status + "\r\nContent-Type: " + type + "\r\nCache-Control: " + cache + "\r\n");
        if (!status.StartsWith("304")) header.Append("Content-Length: " + length + "\r\n");
        if (etag != null) header.Append("ETag: " + etag + "\r\nLast-Modified: " + modified + "\r\n");
        header.Append("X-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n");
        byte[] bytes = Encoding.ASCII.GetBytes(header.ToString());
        SendBytes(socket, bytes);
        if (!head && body != null) SendBytes(socket, body);
    }
}
"@
[PsychologyJanePreviewServer]::Run($projectRoot, $Port)
