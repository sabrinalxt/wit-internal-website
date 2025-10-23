DROP SCHEMA IF EXISTS wit_internal_website;

CREATE SCHEMA wit_internal_website;

--
-- Table: ROLE
--
CREATE TABLE wit_internal_website.role (
    role_id SERIAL PRIMARY KEY, -- Using SERIAL for auto-incrementing integer ID
    role_name VARCHAR(50) NOT NULL UNIQUE CHECK (role_name IN ('Requestor', 'Approver', 'Admin', 'Viewer'))
);

---

--
-- Table: USER
--
CREATE TABLE wit_internal_website.user (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash CHAR(60) -- Assuming a secure hash (e.g., bcrypt)
);

---

--
-- Table: USER_ROLE (Many-to-Many relationship between USER and ROLE)
--
CREATE TABLE wit_internal_website.user_role (
    user_id INT NOT NULL REFERENCES wit_internal_website.user (user_id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES wit_internal_website.role (role_id) ON DELETE CASCADE
);

---

--
-- Table: PROPOSAL
--
CREATE TABLE wit_internal_website.proposal (
    proposal_id SERIAL PRIMARY KEY,
    proposal_name VARCHAR(255) NOT NULL,
    proposal_type VARCHAR(50) NOT NULL CHECK (proposal_type IN ('IPA', 'FA')), -- Assuming Type is either 'IPA' or 'FA'
    proposal_status VARCHAR(50) NOT NULL,
    date_subitted timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_reviewed timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requestor_id INT NOT NULL REFERENCES wit_internal_website.user (user_id),
    approver_id INT REFERENCES wit_internal_website.user (user_id)
);

---

--
-- Table: TEMPLATE
--
CREATE TABLE wit_internal_website.template (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50),
    content_link VARCHAR(512),
    admin_id INT NOT NULL REFERENCES wit_internal_website.user (user_id)
);

---

--
-- Table: EVENT
--
CREATE TABLE wit_internal_website.event (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE,
    pillar VARCHAR(100), -- Assuming Pillar is a string name
    proposal_id INT NOT NULL REFERENCES wit_internal_website.proposal (proposal_id),
    admin_id INT NOT NULL REFERENCES wit_internal_website.user (user_id)
);

---

--
-- Table: NETWORK_CONTACT (Could also be called EXTERNAL_CONTACT)
--
CREATE TABLE wit_internal_website.network_contact (
    network_contact_id SERIAL PRIMARY KEY,
    network_contact_name VARCHAR(255) NOT NULL,
    network_contact_email VARCHAR(255) UNIQUE,
    network_contact_association VARCHAR(255),
    pillar_interest VARCHAR(100)
);

---

--
-- Table: EVENT_CONTACT (Many-to-Many relationship between EVENT and NETWORK_CONTACT)
--
CREATE TABLE wit_internal_website.event_contact (
    event_contact_event_id BIGINT UNSIGNED NOT NULL,
    event_contact_contact_id BIGINT UNSIGNED NOT NULL,
    event_contact_association VARCHAR(255), -- Additional attribute from the model
    PRIMARY KEY (event_contact_event_id, event_contact_contact_id),
    FOREIGN KEY (event_contact_event_id) REFERENCES wit_internal_website.event (event_id) ON DELETE CASCADE,
    FOREIGN KEY (event_contact_contact_id) REFERENCES wit_internal_website.network_contact (network_contact_id) ON DELETE CASCADE
);

---

--
-- Table: ACCESS (Permission for a User to see a specific Template)
--
CREATE TABLE wit_internal_website.access (
    access_user_id BIGINT UNSIGNED NOT NULL,
    access_template_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (access_user_id, access_template_id),
    FOREIGN KEY (access_user_id) REFERENCES wit_internal_website.user (user_id) ON DELETE CASCADE,
    FOREIGN KEY (access_template_id) REFERENCES wit_internal_website.template (template_id) ON DELETE CASCADE
);

---

--
-- Table: VIEW (Record of a User viewing a specific Event)
--
CREATE TABLE wit_internal_website.view (
    view_user_id BIGINT UNSIGNED NOT NULL,
    view_event_id BIGINT UNSIGNED NOT NULL,
    view_template_id BIGINT UNSIGNED,
    PRIMARY KEY (view_user_id, view_event_id, view_template_id), -- Composite Primary Key as shown
    FOREIGN KEY (view_user_id) REFERENCES wit_internal_website.user (user_id) ON DELETE CASCADE,
    FOREIGN KEY (view_event_id) REFERENCES wit_internal_website.event (event_id) ON DELETE CASCADE,
    FOREIGN KEY (view_template_id) REFERENCES wit_internal_website.template (template_id) ON DELETE CASCADE
);