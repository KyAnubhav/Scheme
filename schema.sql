CREATE DATABASE governmentScheme;
GO
USE governmentScheme;
GO

CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    phone NVARCHAR(20) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_verified BIT NOT NULL DEFAULT 0,
    email_verified_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT CK_Users_Role CHECK (role IN ('user', 'admin'))
);

CREATE TABLE UserProfiles (
    user_id INT PRIMARY KEY,
    dob DATE NULL,
    gender VARCHAR(20) NULL,
    marital_status VARCHAR(20) NULL,
    category VARCHAR(30) NULL,
    state NVARCHAR(80) NULL,
    district NVARCHAR(80) NULL,
    pincode VARCHAR(10) NULL,
    annual_family_income DECIMAL(12,2) NULL,
    occupation NVARCHAR(100) NULL,
    education_level NVARCHAR(100) NULL,
    institution_name NVARCHAR(150) NULL,
    course_name NVARCHAR(150) NULL,
    is_student BIT NOT NULL DEFAULT 0,
    is_farmer BIT NOT NULL DEFAULT 0,
    land_holding_acres DECIMAL(6,2) NULL,
    disability_percent INT NULL,
    minority_status BIT NOT NULL DEFAULT 0,
    women_headed_household BIT NOT NULL DEFAULT 0,
    single_parent BIT NOT NULL DEFAULT 0,
    currently_employed BIT NOT NULL DEFAULT 0,
    aadhaar_verified BIT NOT NULL DEFAULT 0,
    bank_account_linked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_UserProfiles_Users FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Ministries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ministry_name NVARCHAR(150) NOT NULL UNIQUE,
    short_code VARCHAR(50) NULL,
    description NVARCHAR(500) NULL,
    website_url NVARCHAR(255) NULL,
    contact_email NVARCHAR(150) NULL,
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE SchemeCategories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(120) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description NVARCHAR(500) NULL,
    icon_name VARCHAR(80) NULL,
    active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE TABLE Schemes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    scheme_code VARCHAR(50) NOT NULL UNIQUE,
    scheme_name NVARCHAR(200) NOT NULL,
    short_title NVARCHAR(120) NULL,
    description NVARCHAR(MAX) NOT NULL,
    ministry_id INT NOT NULL,
    category_id INT NOT NULL,
    beneficiary_type VARCHAR(30) NOT NULL,
    target_audience NVARCHAR(200) NULL,
    application_mode VARCHAR(20) NOT NULL,
    benefit_type VARCHAR(40) NOT NULL,
    benefit_amount DECIMAL(12,2) NULL,
    income_limit DECIMAL(12,2) NULL,
    age_min INT NULL,
    age_max INT NULL,
    state_scope NVARCHAR(80) NULL,
    launch_date DATE NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    deadline DATE NULL,
    official_website NVARCHAR(255) NULL,
    application_link NVARCHAR(255) NULL,
    documents_link NVARCHAR(255) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_by INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Schemes_Ministries FOREIGN KEY (ministry_id) REFERENCES Ministries(id),
    CONSTRAINT FK_Schemes_Categories FOREIGN KEY (category_id) REFERENCES SchemeCategories(id),
    CONSTRAINT FK_Schemes_CreatedBy FOREIGN KEY (created_by) REFERENCES Users(id)
);

CREATE TABLE SchemeEligibilityRules (
    id INT IDENTITY(1,1) PRIMARY KEY,
    scheme_id INT NOT NULL,
    field_name NVARCHAR(100) NOT NULL,
    operator_name VARCHAR(20) NOT NULL,
    value1 NVARCHAR(255) NULL,
    value2 NVARCHAR(255) NULL,
    mandatory BIT NOT NULL DEFAULT 1,
    notes NVARCHAR(255) NULL,
    CONSTRAINT FK_Rules_Scheme FOREIGN KEY (scheme_id) REFERENCES Schemes(id) ON DELETE CASCADE,
    CONSTRAINT CK_Rules_Operator CHECK (operator_name IN ('=','!=','<','<=','>','>=','IN','BETWEEN','LIKE'))
);

CREATE TABLE SchemeRequiredDocuments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    scheme_id INT NOT NULL,
    document_name NVARCHAR(150) NOT NULL,
    document_code VARCHAR(50) NULL,
    mandatory BIT NOT NULL DEFAULT 1,
    notes NVARCHAR(255) NULL,
    CONSTRAINT FK_Documents_Scheme FOREIGN KEY (scheme_id) REFERENCES Schemes(id) ON DELETE CASCADE
);

CREATE TABLE UserSchemeMatches (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    match_status VARCHAR(20) NOT NULL DEFAULT 'eligible',
    score DECIMAL(5,2) NULL,
    checked_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    notified_at DATETIME2 NULL,
    CONSTRAINT FK_Matches_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Matches_Scheme FOREIGN KEY (scheme_id) REFERENCES Schemes(id) ON DELETE CASCADE,
    CONSTRAINT UQ_UserScheme UNIQUE (user_id, scheme_id)
);

CREATE TABLE Notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_id INT NULL,
    notification_type VARCHAR(20) NOT NULL DEFAULT 'email',
    subject NVARCHAR(200) NOT NULL,
    message_body NVARCHAR(MAX) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    error_message NVARCHAR(500) NULL,
    sent_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Notifications_User FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_Notifications_Scheme FOREIGN KEY (scheme_id) REFERENCES Schemes(id) ON DELETE SET NULL
);
GO

INSERT INTO Ministries (ministry_name, short_code, description) VALUES
('Ministry of Education', 'EDU', 'Education-related scholarships and support'),
('Ministry of Rural Development', 'RURAL', 'Rural livelihood and development support'),
('Ministry of Women and Child Development', 'WCD', 'Women, children, and family welfare'),
('Ministry of Social Justice and Empowerment', 'SJE', 'Support for disadvantaged and vulnerable groups'),
('Ministry of Agriculture and Farmers Welfare', 'AGRI', 'Farmer and agriculture support');
GO

INSERT INTO SchemeCategories (category_name, slug, description, icon_name) VALUES
('Scholarship', 'scholarship', 'Education scholarships and fee support', 'graduation-cap'),
('Women Support', 'women-support', 'Women empowerment and support', 'users'),
('Farmer Support', 'farmer-support', 'Agricultural and farmer assistance', 'leaf'),
('Disability Support', 'disability-support', 'Support for persons with disabilities', 'accessibility'),
('Livelihood', 'livelihood', 'Income and employment assistance', 'briefcase');
GO

CREATE TABLE TempSeedIds (
    id INT IDENTITY(1,1) PRIMARY KEY,
    note NVARCHAR(50)
);
DROP TABLE TempSeedIds;
GO
