-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` CHAR(60) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` ENUM('Requestor', 'PillarLead', 'Approver', 'Admin', 'Viewer') NOT NULL,

    UNIQUE INDEX `Role_role_name_key`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,

    UNIQUE INDEX `UserRole_user_id_role_id_key`(`user_id`, `role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proposal` (
    `proposal_id` INTEGER NOT NULL AUTO_INCREMENT,
    `proposal_name` VARCHAR(255) NOT NULL,
    `proposal_type` ENUM('IPA', 'FA') NOT NULL,
    `proposal_status` ENUM('DRAFT', 'SUBMITTED', 'PILLAR_APPROVED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `drive_link` VARCHAR(512) NULL,
    `rejection_reason` TEXT NULL,
    `date_submitted` TIMESTAMP(0) NULL,
    `date_reviewed` TIMESTAMP(0) NULL,
    `requestor_id` INTEGER NOT NULL,
    `pillar_lead_id` INTEGER NULL,
    `approver_id` INTEGER NULL,
    `parent_proposal_id` INTEGER NULL,

    INDEX `Proposal_requestor_id_idx`(`requestor_id`),
    INDEX `Proposal_pillar_lead_id_idx`(`pillar_lead_id`),
    INDEX `Proposal_approver_id_idx`(`approver_id`),
    INDEX `Proposal_parent_proposal_id_idx`(`parent_proposal_id`),
    PRIMARY KEY (`proposal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProposalStatusHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `proposal_id` INTEGER NOT NULL,
    `changed_by_id` INTEGER NOT NULL,
    `from_status` ENUM('DRAFT', 'SUBMITTED', 'PILLAR_APPROVED', 'APPROVED', 'REJECTED') NULL,
    `to_status` ENUM('DRAFT', 'SUBMITTED', 'PILLAR_APPROVED', 'APPROVED', 'REJECTED') NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProposalStatusHistory_proposal_id_idx`(`proposal_id`),
    INDEX `ProposalStatusHistory_changed_by_id_idx`(`changed_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Template` (
    `template_id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_name` VARCHAR(255) NOT NULL,
    `template_type` VARCHAR(50) NULL,
    `content_link` VARCHAR(512) NULL,
    `admin_id` INTEGER NOT NULL,

    INDEX `Template_admin_id_idx`(`admin_id`),
    PRIMARY KEY (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `event_id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_name` VARCHAR(255) NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NULL,
    `pillar` VARCHAR(100) NULL,
    `proposal_id` INTEGER NULL,
    `admin_id` INTEGER NOT NULL,

    INDEX `Event_proposal_id_idx`(`proposal_id`),
    INDEX `Event_admin_id_idx`(`admin_id`),
    INDEX `Event_start_at_idx`(`start_at`),
    PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NetworkContact` (
    `network_contact_id` INTEGER NOT NULL AUTO_INCREMENT,
    `network_contact_name` VARCHAR(255) NOT NULL,
    `network_contact_email` VARCHAR(255) NULL,
    `network_contact_association` VARCHAR(255) NULL,
    `pillar_interest` VARCHAR(100) NULL,

    UNIQUE INDEX `NetworkContact_network_contact_email_key`(`network_contact_email`),
    PRIMARY KEY (`network_contact_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventContact` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `contact_id` INTEGER NOT NULL,
    `event_contact_association` VARCHAR(255) NULL,

    INDEX `EventContact_contact_id_idx`(`contact_id`),
    UNIQUE INDEX `EventContact_event_id_contact_id_key`(`event_id`, `contact_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_requestor_id_fkey` FOREIGN KEY (`requestor_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_pillar_lead_id_fkey` FOREIGN KEY (`pillar_lead_id`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `User`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposal` ADD CONSTRAINT `Proposal_parent_proposal_id_fkey` FOREIGN KEY (`parent_proposal_id`) REFERENCES `Proposal`(`proposal_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProposalStatusHistory` ADD CONSTRAINT `ProposalStatusHistory_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `Proposal`(`proposal_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProposalStatusHistory` ADD CONSTRAINT `ProposalStatusHistory_changed_by_id_fkey` FOREIGN KEY (`changed_by_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Template` ADD CONSTRAINT `Template_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `Proposal`(`proposal_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventContact` ADD CONSTRAINT `EventContact_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `Event`(`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventContact` ADD CONSTRAINT `EventContact_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `NetworkContact`(`network_contact_id`) ON DELETE CASCADE ON UPDATE CASCADE;
