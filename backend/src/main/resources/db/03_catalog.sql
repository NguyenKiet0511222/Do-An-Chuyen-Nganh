-- Buoc 3: shop, danh muc, san pham, anh san pham, ket qua AI (api.md muc 2).
-- Entity tuong ung: Shop, Category, Product, ProductImage, AiResult. Thay doi cot -> sua ca entity va bao nhom.
-- Chay sau 02_users.sql. Script chi tao bang neu chua co (backend ddl-auto=update co the da tao truoc).
USE nongsan_db;
GO
-- Bat buoc cho filtered index o bang ai_results (SSMS bat san, sqlcmd thi khong)
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'dbo.shops', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.shops (
        id            BIGINT IDENTITY(1,1) NOT NULL,
        user_id       BIGINT         NOT NULL,                  -- 1 user <-> 1 shop
        shop_name     NVARCHAR(150)  NOT NULL,
        description   NVARCHAR(MAX)  NULL,
        province      NVARCHAR(100)  NULL,
        address       NVARCHAR(255)  NULL,
        phone         VARCHAR(20)    NULL,
        logo_url      NVARCHAR(500)  NULL,
        status        VARCHAR(30)    NOT NULL CONSTRAINT df_shops_status DEFAULT 'PENDING_VERIFICATION',
        rating_avg    DECIMAL(2,1)   NOT NULL CONSTRAINT df_shops_rating_avg DEFAULT 0,
        rating_count  INT            NOT NULL CONSTRAINT df_shops_rating_count DEFAULT 0,
        verified_at   DATETIME2      NULL,
        created_at    DATETIME2      NOT NULL CONSTRAINT df_shops_created DEFAULT SYSDATETIME(),
        updated_at    DATETIME2      NULL,
        CONSTRAINT pk_shops PRIMARY KEY (id),
        CONSTRAINT uk_shops_user UNIQUE (user_id),
        CONSTRAINT fk_shops_user FOREIGN KEY (user_id) REFERENCES dbo.users (id),
        -- Luong dung: PENDING_VERIFICATION -> ACTIVE <-> LOCKED; 3 gia tri cuoi co trong enum cu, chua dung
        CONSTRAINT ck_shops_status CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'LOCKED',
                                                     'SUSPENDED', 'REJECTED', 'INACTIVE'))
    );
END
GO

IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.categories (
        id              BIGINT IDENTITY(1,1) NOT NULL,
        name            NVARCHAR(100)  NOT NULL,
        slug            VARCHAR(150)   NOT NULL,
        parent_id       BIGINT         NULL,                    -- NULL = danh muc cha (cay 2 cap)
        description     NVARCHAR(500)  NULL,
        image_url       NVARCHAR(500)  NULL,
        display_order   INT            NOT NULL CONSTRAINT df_categories_order DEFAULT 0,
        is_active       BIT            NOT NULL CONSTRAINT df_categories_active DEFAULT 1,
        ai_produce_keys VARCHAR(255)   NULL,                    -- vd "tomato,potato,carrot"
        created_at      DATETIME2      NOT NULL CONSTRAINT df_categories_created DEFAULT SYSDATETIME(),
        updated_at      DATETIME2      NULL,
        CONSTRAINT pk_categories PRIMARY KEY (id),
        CONSTRAINT uk_categories_slug UNIQUE (slug),
        CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES dbo.categories (id)
    );
END
GO

IF OBJECT_ID(N'dbo.products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.products (
        id                     BIGINT IDENTITY(1,1) NOT NULL,
        shop_id                BIGINT         NOT NULL,
        category_id            BIGINT         NOT NULL,
        name                   NVARCHAR(200)  NOT NULL,
        slug                   VARCHAR(250)   NOT NULL,
        description            NVARCHAR(MAX)  NULL,
        price                  BIGINT         NOT NULL,         -- VND
        unit                   NVARCHAR(20)   NOT NULL,
        stock_quantity         INT            NOT NULL CONSTRAINT df_products_stock DEFAULT 0,
        origin                 NVARCHAR(150)  NULL,
        status                 VARCHAR(20)    NOT NULL CONSTRAINT df_products_status DEFAULT 'DRAFT',
        hidden_by              VARCHAR(10)    NULL,             -- SELLER | ADMIN khi status = HIDDEN
        reject_reason          NVARCHAR(500)  NULL,
        ai_overall_label       VARCHAR(20)    NULL,             -- xau nhat trong cac anh
        ai_overall_confidence  DECIMAL(5,4)   NULL,
        sold_count             INT            NOT NULL CONSTRAINT df_products_sold DEFAULT 0,
        rating_avg             DECIMAL(2,1)   NOT NULL CONSTRAINT df_products_rating_avg DEFAULT 0,
        rating_count           INT            NOT NULL CONSTRAINT df_products_rating_count DEFAULT 0,
        approved_at            DATETIME2      NULL,
        created_at             DATETIME2      NOT NULL CONSTRAINT df_products_created DEFAULT SYSDATETIME(),
        updated_at             DATETIME2      NULL,
        CONSTRAINT pk_products PRIMARY KEY (id),
        CONSTRAINT uk_products_slug UNIQUE (slug),
        CONSTRAINT fk_products_shop FOREIGN KEY (shop_id) REFERENCES dbo.shops (id),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES dbo.categories (id),
        CONSTRAINT ck_products_status CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'NEED_INFO', 'HIDDEN')),
        CONSTRAINT ck_products_hidden_by CHECK (hidden_by IS NULL OR hidden_by IN ('SELLER', 'ADMIN')),
        CONSTRAINT ck_products_price CHECK (price > 0),
        CONSTRAINT ck_products_stock CHECK (stock_quantity >= 0)
    );
    CREATE INDEX ix_products_shop_status ON dbo.products (shop_id, status);
END
GO

IF OBJECT_ID(N'dbo.product_images', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.product_images (
        id             BIGINT IDENTITY(1,1) NOT NULL,
        product_id     BIGINT         NOT NULL,
        url            VARCHAR(500)   NOT NULL,                 -- /uploads/products/{productId}/{uuid}.{ext}
        display_order  INT            NOT NULL CONSTRAINT df_product_images_order DEFAULT 0,
        is_primary     BIT            NOT NULL CONSTRAINT df_product_images_primary DEFAULT 0,
        created_at     DATETIME2      NOT NULL CONSTRAINT df_product_images_created DEFAULT SYSDATETIME(),
        updated_at     DATETIME2      NULL,
        CONSTRAINT pk_product_images PRIMARY KEY (id),
        CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES dbo.products (id) ON DELETE CASCADE
    );
END
GO

IF OBJECT_ID(N'dbo.ai_results', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ai_results (
        id                BIGINT IDENTITY(1,1) NOT NULL,
        source            VARCHAR(20)    NOT NULL,              -- PRODUCT_IMAGE | QUICK_CHECK
        product_image_id  BIGINT         NULL,                  -- chi co voi PRODUCT_IMAGE
        user_id           BIGINT         NULL,                  -- chi co voi QUICK_CHECK
        image_url         VARCHAR(500)   NOT NULL,
        produce           VARCHAR(50)    NULL,
        label             VARCHAR(20)    NOT NULL,              -- FRESH | ROTTEN | UNCERTAIN
        confidence        DECIMAL(5,4)   NOT NULL CONSTRAINT df_ai_results_confidence DEFAULT 0,
        model_version     VARCHAR(50)    NULL,
        review_status     VARCHAR(30)    NOT NULL CONSTRAINT df_ai_results_review DEFAULT 'AUTO_ACCEPTED',
        final_label       VARCHAR(20)    NULL,                  -- nhan admin sua (luu de retrain)
        reviewed_by       BIGINT         NULL,
        reviewed_at       DATETIME2      NULL,
        note              NVARCHAR(500)  NULL,
        inference_ms      INT            NULL,
        created_at        DATETIME2      NOT NULL CONSTRAINT df_ai_results_created DEFAULT SYSDATETIME(),
        updated_at        DATETIME2      NULL,
        CONSTRAINT pk_ai_results PRIMARY KEY (id),
        CONSTRAINT fk_ai_results_image FOREIGN KEY (product_image_id) REFERENCES dbo.product_images (id) ON DELETE CASCADE,
        CONSTRAINT fk_ai_results_user FOREIGN KEY (user_id) REFERENCES dbo.users (id),
        CONSTRAINT fk_ai_results_reviewer FOREIGN KEY (reviewed_by) REFERENCES dbo.users (id),
        CONSTRAINT ck_ai_results_source CHECK (source IN ('PRODUCT_IMAGE', 'QUICK_CHECK')),
        CONSTRAINT ck_ai_results_label CHECK (label IN ('FRESH', 'ROTTEN', 'UNCERTAIN')),
        CONSTRAINT ck_ai_results_review CHECK (review_status IN ('AUTO_ACCEPTED', 'PENDING_REVIEW', 'ACCEPTED',
                                                                 'CORRECTED', 'RETAKE_REQUESTED'))
    );
    -- 1 anh <-> 1 ket qua moi nhat. Loc "IS NOT NULL" vi SQL Server chi cho 1 dong NULL trong UNIQUE thuong,
    -- trong khi QUICK_CHECK co nhieu dong product_image_id = NULL.
    CREATE UNIQUE INDEX ux_ai_results_image ON dbo.ai_results (product_image_id) WHERE product_image_id IS NOT NULL;
    CREATE INDEX ix_ai_results_review ON dbo.ai_results (review_status);
END
GO
