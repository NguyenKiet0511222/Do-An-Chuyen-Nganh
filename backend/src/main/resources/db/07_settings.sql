-- Buoc 7: cau hinh he thong dang key-value (api.md muc 2, docs/1910.md muc 4). Entity tuong ung: Setting.
-- Bang da co trong ERD goc nhung truoc day chua tao - them 19/10/2026, da bao nhom. Thay doi cot -> sua ca entity va bao nhom.
-- Hien dung cho 2 nguong tin cay AI: admin doi qua PUT /api/admin/ai/settings, khong can khoi dong lai backend.
-- Bang trong / thieu dong -> backend dung gia tri mac dinh app.ai.* trong application.properties.
-- KHONG luu model_version o day (api.md cu co ghi): so nay doc tu GET /health cua AI service.
-- Chay sau 06_product_review_history.sql.
USE nongsan_db;
GO

IF OBJECT_ID(N'dbo.settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.settings (
        [key]    VARCHAR(50)    NOT NULL,                       -- vd "ai.auto_accept_threshold"; key/value la tu khoa -> dat trong []
        [value]  NVARCHAR(255)  NOT NULL,
        CONSTRAINT pk_settings PRIMARY KEY ([key])
    );
END
GO

-- Gia tri ban dau (docs/1910.md muc 1): AI = tuoi va confidence >= 0.90 -> tu chap nhan; < 0.70 -> UNCERTAIN
IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'ai.auto_accept_threshold')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('ai.auto_accept_threshold', N'0.90');
IF NOT EXISTS (SELECT 1 FROM dbo.settings WHERE [key] = 'ai.review_threshold')
    INSERT INTO dbo.settings ([key], [value]) VALUES ('ai.review_threshold', N'0.70');
GO
