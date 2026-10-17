# Vue frontend — целева структура

Текущият изпълним прототип е в ../platform и HTML страниците в корена. Vue приложение все още не е инсталирано.

При реализация: Vue router за public/admin views, API client с CSRF/session handling, server-authoritative stores, shared DateTime/Money/Status components, form validation и field errors.

Public views: Home, CmsPage, Booking, Events, EventDetails, Packages, Cart, Login, Register, EmailVerification, Account, ProfileEdit, BookingHistory, OrderHistory.
Admin views: Dashboard, Bookings, Schedule, Users, Packages, HelpTypes, Events, Pages, Media, Payments, Settings, Audit.

Демо localStorage не се използва за реални профили или резервации. Целевият API е ../backend/routes/api-contract.json.
