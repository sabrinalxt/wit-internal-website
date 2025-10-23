-- Drop existing schema if you want to start fresh
DROP SCHEMA IF EXISTS wit_internal_website;
CREATE SCHEMA wit_internal_website;
USE wit_internal_website;

-- ENUMs
CREATE TYPE role_name_enum AS ENUM ('Requestor', 'Approver', 'Admin', 'Viewer');
CREATE TYPE proposal_type_enum AS ENUM ('IPA', 'FA');

-- Role table
CREATE TABLE role (
    role_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_name ENUM('Requestor', 'Approver', 'Admin', 'Viewer') NOT NULL UNIQUE
);

-- User table
CREATE TABLE user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash CHAR(60)
);

-- User_Role table (many-to-many)
CREATE TABLE user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    UNIQUE KEY user_role_unique(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE CASCADE
);

-- Proposal table
CREATE TABLE proposal (
    proposal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    proposal_name VARCHAR(255) NOT NULL,
    proposal_type ENUM('IPA', 'FA') NOT NULL,
    proposal_status VARCHAR(50) NOT NULL,
    date_submitted TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_reviewed TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    requestor_id BIGINT NOT NULL,
    approver_id BIGINT,
    FOREIGN KEY (requestor_id) REFERENCES user(user_id),
    FOREIGN KEY (approver_id) REFERENCES user(user_id)
);

-- Template table
CREATE TABLE template (
    template_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50),
    content_link VARCHAR(512),
    admin_id BIGINT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES user(user_id)
);

-- Event table
CREATE TABLE event (
    event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE,
    pillar VARCHAR(100),
    proposal_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL,
    FOREIGN KEY (proposal_id) REFERENCES proposal(proposal_id),
    FOREIGN KEY (admin_id) REFERENCES user(user_id)
);

-- Network_Contact table
CREATE TABLE network_contact (
    network_contact_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    network_contact_name VARCHAR(255) NOT NULL,
    network_contact_email VARCHAR(255) UNIQUE,
    network_contact_association VARCHAR(255),
    pillar_interest VARCHAR(100)
);

-- Event_Contact table (many-to-many)
CREATE TABLE event_contact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    event_contact_association VARCHAR(255),
    UNIQUE KEY event_contact_unique(event_id, contact_id),
    FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES network_contact(network_contact_id) ON DELETE CASCADE
);

-- Access table (User permission to see Template)
CREATE TABLE access (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    template_id BIGINT NOT NULL,
    UNIQUE KEY access_unique(user_id, template_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES template(template_id) ON DELETE CASCADE
);

-- View table (User viewing Event/Template)
CREATE TABLE view (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    template_id BIGINT,
    UNIQUE KEY view_unique(user_id, event_id, template_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES template(template_id) ON DELETE CASCADE
);
