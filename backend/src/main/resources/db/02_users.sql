-- Buoc 2: bang users (theo tai lieu thiet ke auth; role dung bo CUSTOMER/SELLER/ADMIN theo dac ta do an).
-- Entity tuong ung: com.nhom5.backend.entity.User. Thay doi cot -> sua ca entity va bao nhom.
USE nongsan_db;
GO

IF OBJECT_ID(N'dbo.users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id            BIGINT IDENTITY(1,1) NOT NULL,
        full_name     NVARCHAR(100)  NOT NULL,
        email         NVARCHAR(150)  NOT NULL,
        phone         VARCHAR(20)    NULL,
        password_hash NVARCHAR(255)  NULL,                       -- NULL neu chi dang nhap Google
        provider      VARCHAR(20)    NOT NULL CONSTRAINT df_users_provider  DEFAULT 'LOCAL',
        provider_id   VARCHAR(255)   NULL,                       -- Google "sub"
        role          VARCHAR(20)    NOT NULL CONSTRAINT df_users_role      DEFAULT 'CUSTOMER',
        status        VARCHAR(20)    NULL     CONSTRAINT df_users_status    DEFAULT 'ACTIVE',   -- ACTIVE | LOCKED (admin khoa)
        account_tier  VARCHAR(20)    NOT NULL CONSTRAINT df_users_tier      DEFAULT 'STANDARD', -- STANDARD | PREMIUM (AI khach, api.md 4.7)
        avatar_url    NVARCHAR(500)  NULL,
        is_active     BIT            NOT NULL CONSTRAINT df_users_is_active DEFAULT 1,
        created_at    DATETIME2      NOT NULL CONSTRAINT df_users_created   DEFAULT SYSDATETIME(),
        updated_at    DATETIME2      NULL,
        CONSTRAINT pk_users PRIMARY KEY (id),
        CONSTRAINT uk_users_email UNIQUE (email),
        CONSTRAINT ck_users_provider CHECK (provider IN ('LOCAL', 'GOOGLE')),
        CONSTRAINT ck_users_role CHECK (role IN ('CUSTOMER', 'SELLER', 'ADMIN')),
        CONSTRAINT ck_users_status CHECK (status IS NULL OR status IN ('ACTIVE', 'LOCKED')),
        CONSTRAINT ck_users_tier CHECK (account_tier IN ('STANDARD', 'PREMIUM'))
    );
END
GO

-- DB tao tu script cu (truoc 31/10/2026) chua co 3 cot tren: them neu thieu (ddl-auto co the da tu them).
IF COL_LENGTH(N'dbo.users', N'phone') IS NULL
    ALTER TABLE dbo.users ADD phone VARCHAR(20) NULL;
IF COL_LENGTH(N'dbo.users', N'status') IS NULL
    ALTER TABLE dbo.users ADD status VARCHAR(20) NULL CONSTRAINT df_users_status DEFAULT 'ACTIVE';
IF COL_LENGTH(N'dbo.users', N'account_tier') IS NULL
    ALTER TABLE dbo.users ADD account_tier VARCHAR(20) NOT NULL CONSTRAINT df_users_tier DEFAULT 'STANDARD';
IF COL_LENGTH(N'dbo.users', N'avatar_url') < 1000   -- NVARCHAR(500) = 1000 byte; anh dai dien Google co the dai
    ALTER TABLE dbo.users ALTER COLUMN avatar_url NVARCHAR(500) NULL;
GO
