-- Add nullable doctorName and doctorMobile to sales table
ALTER TABLE `sales`
  ADD COLUMN `doctorName` varchar(191) NULL AFTER `customerAddress`,
  ADD COLUMN `doctorMobile` varchar(191) NULL AFTER `doctorName`;
