-- Add nullable customerAddress to sales table
ALTER TABLE `sales`
  ADD COLUMN `customerAddress` varchar(191) NULL AFTER `customerMobile`;
