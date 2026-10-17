# Сървърни политики за реализация

AdminAccess: admin/editor only on admin domain.
BookingPolicy/SlotPolicy: admin all; editor only own psychologist records.
PagePolicy/HelpTypePolicy/EventPolicy: admin/editor with psychologist scope where applicable.
UserPolicy: client own profile; frozen client read only; roles/status admin only.
PaymentPolicy/PackagePolicy/SettingsPolicy: admin only.
PrivateNotePolicy: staff only with case scope; fields excluded entirely from public serializers.

Всички мутации изискват server-side проверка; скриване на бутони не е контрол на достъп.
