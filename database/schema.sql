--
-- Table: ROLE
--
CREATE TABLE ROLE (
    RoleID SERIAL PRIMARY KEY, -- Using SERIAL for auto-incrementing integer ID
    RoleName VARCHAR(50) NOT NULL UNIQUE CHECK (RoleName IN ('Requestor', 'Approver', 'Admin', 'Viewer'))
);

---

--
-- Table: USER
--
CREATE TABLE "USER" (
    UserID SERIAL PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash CHAR(60) -- Assuming a secure hash (e.g., bcrypt)
);

---

--
-- Table: USER_ROLE (Many-to-Many relationship between USER and ROLE)
--
CREATE TABLE USER_ROLE (
    UserID INT NOT NULL,
    RoleID INT NOT NULL,
    PRIMARY KEY (UserID, RoleID),
    FOREIGN KEY (UserID) REFERENCES "USER" (UserID) ON DELETE CASCADE,
    FOREIGN KEY (RoleID) REFERENCES ROLE (RoleID) ON DELETE CASCADE
);

---

--
-- Table: PROPOSAL
--
CREATE TABLE PROPOSAL (
    ProposalID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Type VARCHAR(50) NOT NULL CHECK (Type IN ('IPA', 'FA')), -- Assuming Type is either 'IPA' or 'FA'
    Status VARCHAR(50) NOT NULL,
    DateSubmitted TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    DateReviewed TIMESTAMP WITH TIME ZONE,
    RequestorID INT NOT NULL,
    ApproverID INT, -- ApproverID can be NULL initially
    FOREIGN KEY (RequestorID) REFERENCES "USER" (UserID),
    FOREIGN KEY (ApproverID) REFERENCES "USER" (UserID)
);

---

--
-- Table: TEMPLATE
--
CREATE TABLE TEMPLATE (
    TemplateID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Type VARCHAR(50),
    ContentLink VARCHAR(512),
    AdminID INT NOT NULL,
    FOREIGN KEY (AdminID) REFERENCES "USER" (UserID)
);

---

--
-- Table: EVENT
--
CREATE TABLE EVENT (
    EventID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Date DATE,
    Pillar VARCHAR(100), -- Assuming Pillar is a string name
    ProposalID INT NOT NULL,
    AdminID INT NOT NULL,
    FOREIGN KEY (ProposalID) REFERENCES PROPOSAL (ProposalID),
    FOREIGN KEY (AdminID) REFERENCES "USER" (UserID)
);

---

--
-- Table: NETWORK_CONTACT (Could also be called EXTERNAL_CONTACT)
--
CREATE TABLE NETWORK_CONTACT (
    ContactID SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Email VARCHAR(255) UNIQUE,
    Association VARCHAR(255),
    PillarInterest VARCHAR(100)
);

---

--
-- Table: EVENT_CONTACT (Many-to-Many relationship between EVENT and NETWORK_CONTACT)
--
CREATE TABLE EVENT_CONTACT (
    EventID INT NOT NULL,
    ContactID INT NOT NULL,
    Association VARCHAR(255), -- Additional attribute from the model
    PRIMARY KEY (EventID, ContactID),
    FOREIGN KEY (EventID) REFERENCES EVENT (EventID) ON DELETE CASCADE,
    FOREIGN KEY (ContactID) REFERENCES NETWORK_CONTACT (ContactID) ON DELETE CASCADE
);

---

--
-- Table: ACCESS (Permission for a User to see a specific Template)
--
CREATE TABLE ACCESS (
    UserID INT NOT NULL,
    TemplateID INT NOT NULL,
    PRIMARY KEY (UserID, TemplateID),
    FOREIGN KEY (UserID) REFERENCES "USER" (UserID) ON DELETE CASCADE,
    FOREIGN KEY (TemplateID) REFERENCES TEMPLATE (TemplateID) ON DELETE CASCADE
);

---

--
-- Table: VIEW (Record of a User viewing a specific Event)
--
CREATE TABLE VIEW (
    UserID INT NOT NULL,
    EventID INT NOT NULL,
    TemplateID INT, -- The model shows this as part of the PK, but it's redundant/unusual
                      -- I'll keep it as a non-PK column or infer that a specific template was viewed *in the context of* the event.
                      -- Based strictly on the image's Primary Key definition:
    TemplateID INT NOT NULL, -- Included in PK as per image
    PRIMARY KEY (UserID, EventID, TemplateID), -- Composite Primary Key as shown
    FOREIGN KEY (UserID) REFERENCES "USER" (UserID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES EVENT (EventID) ON DELETE CASCADE,
    FOREIGN KEY (TemplateID) REFERENCES TEMPLATE (TemplateID) ON DELETE CASCADE
);