# Laravel backend — архитектурна структура

Това не е инсталиран или стартиран Laravel проект. Документирани са целевият модел и API; текущият работещ интерфейс е отделна браузърна демонстрация.

- database/schema.sql: проект на MySQL/MariaDB таблиците; при реализация се преобразува в Laravel migrations.
- routes/api-contract.json: договор за REST endpoints, роли и основни валидации; RESOURCE означава планиран CRUD, не изпълним маршрут.
- app/Http/Controllers: бъдещи публични и административни контролери.
- app/Policies: сървърно налагане на права.
- app/Services: транзакции, резервации, пакети и плащания.
- tests/Feature: целеви интеграционни сценарии.

Необходими за реалния бекенд: PHP runtime, Composer, Laravel зависимости, MySQL/MariaDB, queue worker, SMTP доставчик, Stripe test credentials и webhook endpoint. Процесният инструмент в тази сесия не стартира команди (helper_unknown_error: setup refresh had errors); Node от PATH не е намерен, стартирането на Python е отказано. Не са инсталирани зависимости и не е създавана реална база.

Production: HTTPS, отделен admin host, secure sessions/CSRF, server-side validation, audit logs, backup и правно уточнени срокове за личните данни. Самият демо избор на роля не е защита.
