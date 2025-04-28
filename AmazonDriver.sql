/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: AmazonDriver
-- ------------------------------------------------------
-- Server version	10.11.11-MariaDB-0+deb12u1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Cookies`
--

DROP TABLE IF EXISTS `Cookies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Cookies` (
  `userId` int(11) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL DEFAULT '/',
  `secure` tinyint(1) NOT NULL DEFAULT 0,
  `httpOnly` tinyint(1) NOT NULL DEFAULT 0,
  `sameSite` enum('Strict','Lax','None') DEFAULT NULL,
  `expires` bigint(20) DEFAULT NULL,
  `session` tinyint(1) NOT NULL DEFAULT 0,
  `name` varchar(128) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`userId`,`domain`,`path`,`name`),
  KEY `idx_cookies_user` (`userId`),
  CONSTRAINT `fk_cookies_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DeliveryStatus`
--

DROP TABLE IF EXISTS `DeliveryStatus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `DeliveryStatus` (
  `statusId` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(50) NOT NULL,
  PRIMARY KEY (`statusId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `GeoTracking`
--

DROP TABLE IF EXISTS `GeoTracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GeoTracking` (
  `trackingId` int(11) NOT NULL,
  `timeStamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `alt` double DEFAULT NULL,
  `accuracy` float DEFAULT NULL,
  `deliveryStatusId` int(11) NOT NULL,
  PRIMARY KEY (`trackingId`,`timeStamp`),
  KEY `idx_geotracking_tracking` (`trackingId`),
  KEY `idx_geotracking_status` (`deliveryStatusId`),
  CONSTRAINT `fk_geotracking_status` FOREIGN KEY (`deliveryStatusId`) REFERENCES `DeliveryStatus` (`statusId`) ON UPDATE CASCADE,
  CONSTRAINT `fk_geotracking_tracking` FOREIGN KEY (`trackingId`) REFERENCES `TrackingNumbers` (`trackingId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `GeoTrackingBackup`
--

DROP TABLE IF EXISTS `GeoTrackingBackup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `GeoTrackingBackup` (
  `trackingId` int(11) NOT NULL,
  `timeStamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `alt` double DEFAULT NULL,
  `accuracy` float DEFAULT NULL,
  `deliveryStatusId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Packages`
--

DROP TABLE IF EXISTS `Packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Packages` (
  `userId` int(11) NOT NULL,
  `trackingId` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `pickedUpAt` timestamp NULL DEFAULT NULL,
  `deliveredAt` timestamp NULL DEFAULT NULL,
  `lastUpdated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `destLat` double DEFAULT NULL,
  `destLon` double DEFAULT NULL,
  `destAlt` double DEFAULT NULL,
  `accuracy` float DEFAULT NULL,
  `deliveryStatusId` int(11) DEFAULT NULL,
  PRIMARY KEY (`userId`,`trackingId`),
  KEY `idx_packages_user` (`userId`),
  KEY `idx_packages_tracking` (`trackingId`),
  KEY `fk_packages_status` (`deliveryStatusId`),
  CONSTRAINT `fk_packages_status` FOREIGN KEY (`deliveryStatusId`) REFERENCES `DeliveryStatus` (`statusId`),
  CONSTRAINT `fk_packages_tracking` FOREIGN KEY (`trackingId`) REFERENCES `TrackingNumbers` (`trackingId`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_packages_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `TrackingNumbers`
--

DROP TABLE IF EXISTS `TrackingNumbers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `TrackingNumbers` (
  `trackingId` int(11) NOT NULL AUTO_INCREMENT,
  `trackingNumber` varchar(64) NOT NULL,
  PRIMARY KEY (`trackingId`),
  UNIQUE KEY `uq_trackingNumbers_number` (`trackingNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `userId` int(11) NOT NULL AUTO_INCREMENT,
  `userName` varchar(128) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `password` varchar(16) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userId`),
  UNIQUE KEY `uq_users_userName` (`userName`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'AmazonDriver'
--
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddGeoTrackingEntry` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `AddGeoTrackingEntry`(
    IN in_trackingNumber VARCHAR(64),
    IN in_timeStamp      DATETIME,
    IN in_lat            DOUBLE,
    IN in_lon            DOUBLE,
    IN in_alt            DOUBLE,
    IN in_accuracy       FLOAT,
    IN in_status         VARCHAR(50)
)
BEGIN
  DECLARE tid INT;
  DECLARE sid INT;

  
  SELECT trackingId
    INTO tid
    FROM TrackingNumbers
    WHERE trackingNumber = in_trackingNumber
    LIMIT 1;
  IF tid IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tracking number not found';
  END IF;

  
  SELECT statusId
    INTO sid
    FROM DeliveryStatus
    WHERE status = in_status
    LIMIT 1;
  IF sid IS NULL THEN
    INSERT INTO DeliveryStatus (status)
      VALUES (in_status);
    SET sid = LAST_INSERT_ID();
  END IF;

  
  INSERT INTO GeoTracking (
    timeStamp,
    trackingId,
    lat, lon, alt,
    accuracy,
    deliveryStatusId
  ) VALUES (
    in_timeStamp,
    tid,
    in_lat, in_lon, in_alt,
    in_accuracy,
    sid
  )
  ON DUPLICATE KEY UPDATE
    lat               = VALUES(lat),
    lon               = VALUES(lon),
    alt               = VALUES(alt),
    accuracy          = VALUES(accuracy),
    deliveryStatusId  = VALUES(deliveryStatusId);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `AddPackageForUser` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`192.168.0.%` PROCEDURE `AddPackageForUser`(
    IN in_userName       VARCHAR(128),
    IN in_trackingNumber VARCHAR(64),
    IN in_destLat        DOUBLE,
    IN in_destLon        DOUBLE,
    IN in_destAlt        DOUBLE,
    IN in_accuracy       FLOAT
)
BEGIN
  DECLARE uid INT;
  DECLARE tid INT;

  
  SELECT userId INTO uid
    FROM Users
    WHERE userName = in_userName
    LIMIT 1;
  IF uid IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
  END IF;

  
  SELECT trackingId INTO tid
    FROM TrackingNumbers
    WHERE trackingNumber = in_trackingNumber
    LIMIT 1;

  IF tid IS NULL THEN
    INSERT INTO TrackingNumbers (trackingNumber)
      VALUES (in_trackingNumber);
    SET tid = LAST_INSERT_ID();
  END IF;

  
  INSERT INTO Packages (
    userId, trackingId,
    destLat, destLon, destAlt,
    accuracy
  ) VALUES (
    uid, tid,
    in_destLat, in_destLon, in_destAlt,
    in_accuracy
  );
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `CreateUser` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`192.168.0.%` PROCEDURE `CreateUser`(
    IN in_userName VARCHAR(128),
    IN in_password VARCHAR(16)
)
BEGIN
  INSERT INTO Users (userName, password)
    VALUES (in_userName, in_password);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetAllPackages` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `GetAllPackages`()
BEGIN
  SELECT
    u.userName             AS userName,
    tn.trackingNumber      AS trackingNumber,
    p.createdAt            AS packageCreatedAt
  FROM Packages AS p
  JOIN Users AS u
    ON p.userId = u.userId
  JOIN TrackingNumbers AS tn
    ON p.trackingId = tn.trackingId;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetCurrentLocationByTrackingNumber` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`192.168.0.%` PROCEDURE `GetCurrentLocationByTrackingNumber`(
    IN in_trackingNumber VARCHAR(64)
)
BEGIN
  DECLARE tid INT;

  SELECT trackingId INTO tid
    FROM TrackingNumbers
    WHERE trackingNumber = in_trackingNumber;

  SELECT
    g.timeStamp,
    g.lat,
    g.lon,
    g.alt,
    g.accuracy,
    ds.status AS deliveryStatus
  FROM GeoTracking AS g
  JOIN DeliveryStatus AS ds
    ON g.deliveryStatusId = ds.statusId
  WHERE g.trackingId = tid
    AND g.lat IS NOT NULL
    AND g.lon IS NOT NULL
  ORDER BY g.timeStamp DESC
  LIMIT 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetGeoEntriesByTrackingNumber` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `GetGeoEntriesByTrackingNumber`(
  IN in_trackingNumber VARCHAR(64),
  IN in_after          DATETIME,
  IN in_until          DATETIME
)
BEGIN
  DECLARE tid INT;

  SELECT trackingId
    INTO tid
    FROM TrackingNumbers
    WHERE trackingNumber = in_trackingNumber
    LIMIT 1;

  IF tid IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Tracking number not found';
  END IF;

  SELECT
    g.timeStamp,
    g.lat,
    g.lon,
    g.alt,
    g.accuracy,
    ds.status AS deliveryStatus
  FROM GeoTracking AS g
  JOIN DeliveryStatus AS ds
    ON g.deliveryStatusId = ds.statusId
  WHERE g.trackingId = tid
    AND (in_after  IS NULL OR g.timeStamp > in_after)
    AND (in_until IS NULL OR g.timeStamp <= in_until)
  ORDER BY g.timeStamp ASC;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetPackageStatus` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `GetPackageStatus`(
    IN in_trackingNumber VARCHAR(64)
)
BEGIN
  SELECT
    ds.status AS deliveryStatus
  FROM Packages AS p
  JOIN TrackingNumbers AS tn
    ON p.trackingId = tn.trackingId
  JOIN DeliveryStatus AS ds
    ON p.deliveryStatusId = ds.statusId
  WHERE tn.trackingNumber = in_trackingNumber;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetUserCookie` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `GetUserCookie`(
    IN in_userName VARCHAR(128),
    IN in_domain   VARCHAR(255),
    IN in_path     VARCHAR(255),
    IN in_name     VARCHAR(128)
)
BEGIN
  DECLARE uid INT;

  SELECT userId INTO uid
    FROM Users
    WHERE userName = in_userName
    LIMIT 1;
  IF uid IS NULL THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'User not found';
  END IF;

  SELECT
    domain,
    path,
    secure,
    httpOnly,
    sameSite,
    expires,
    session,
    name,
    value
  FROM Cookies
  WHERE userId = uid
    AND domain = in_domain
    AND path   = in_path
    AND name   = in_name;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `GetUserCookies` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `GetUserCookies`(
    IN in_userName VARCHAR(128)
)
BEGIN
  DECLARE uid INT;

  SELECT userId INTO uid
    FROM Users
    WHERE userName = in_userName
    LIMIT 1;
  IF uid IS NULL THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'User not found';
  END IF;

  SELECT
    domain,
    path,
    secure,
    httpOnly,
    sameSite,
    expires,
    session,
    name,
    value
  FROM Cookies
  WHERE userId = uid;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `SetDeliveredTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `SetDeliveredTime`(
    IN in_trackingNumber VARCHAR(64),
    IN in_deliveredAt    DATETIME
)
BEGIN
  proc_block: BEGIN
    DECLARE v_trackingId INT;

    
    SELECT trackingId
      INTO v_trackingId
      FROM TrackingNumbers
      WHERE trackingNumber = in_trackingNumber
      LIMIT 1;

    
    IF v_trackingId IS NULL THEN
      LEAVE proc_block;
    END IF;

    
    UPDATE Packages
      SET
        deliveredAt = COALESCE(in_deliveredAt, NOW()),
        lastUpdated = CURRENT_TIMESTAMP
      WHERE trackingId = v_trackingId
        AND deliveredAt IS NULL;
  END proc_block;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `SetPickupTime` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `SetPickupTime`(
    IN in_trackingNumber VARCHAR(64),
    IN in_pickedUpAt     DATETIME
)
BEGIN
  proc_block: BEGIN
    DECLARE v_trackingId INT;

    
    SELECT trackingId
      INTO v_trackingId
      FROM TrackingNumbers
      WHERE trackingNumber = in_trackingNumber
      LIMIT 1;

    
    IF v_trackingId IS NULL THEN
      LEAVE proc_block;
    END IF;

    
    UPDATE Packages
      SET
        pickedUpAt = COALESCE(in_pickedUpAt, NOW()),
        lastUpdated = CURRENT_TIMESTAMP
      WHERE trackingId = v_trackingId
        AND pickedUpAt IS NULL;
  END proc_block;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpdatePackageStatus` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `UpdatePackageStatus`(
    IN in_trackingNumber VARCHAR(64),
    IN in_status         VARCHAR(50)
)
BEGIN
  proc_block: BEGIN
    DECLARE v_trackingId INT;
    DECLARE v_statusId   INT;

    
    SELECT trackingId
      INTO v_trackingId
      FROM TrackingNumbers
      WHERE trackingNumber = in_trackingNumber
      LIMIT 1;
    IF v_trackingId IS NULL THEN
      
      LEAVE proc_block;
    END IF;

    
    SELECT statusId
      INTO v_statusId
      FROM DeliveryStatus
      WHERE status = in_status
      LIMIT 1;
    IF v_statusId IS NULL THEN
      INSERT INTO DeliveryStatus (status)
        VALUES (in_status);
      SET v_statusId = LAST_INSERT_ID();
    END IF;

    
    UPDATE Packages
      SET
        deliveryStatusId = v_statusId,
        lastUpdated      = CURRENT_TIMESTAMP
      WHERE trackingId = v_trackingId;
  END proc_block;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */ ;
/*!50003 DROP PROCEDURE IF EXISTS `UpsertUserCookie` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
DELIMITER ;;
CREATE DEFINER=`amazon`@`tp.localdomain` PROCEDURE `UpsertUserCookie`(
    IN in_userName VARCHAR(128),
    IN in_domain   VARCHAR(255),
    IN in_path     VARCHAR(255),
    IN in_secure   TINYINT(1),
    IN in_httpOnly TINYINT(1),
    IN in_sameSite ENUM('Strict','Lax','None'),
    IN in_expires  BIGINT,
    IN in_session  TINYINT(1),
    IN in_name     VARCHAR(128),
    IN in_value    TEXT
)
BEGIN
  DECLARE uid INT;

  
  SELECT userId INTO uid
    FROM Users
    WHERE userName = in_userName
    LIMIT 1;
  IF uid IS NULL THEN
    SIGNAL SQLSTATE '45000' 
      SET MESSAGE_TEXT = 'User not found';
  END IF;

  
  UPDATE Cookies
    SET
      secure   = in_secure,
      httpOnly = in_httpOnly,
      sameSite = in_sameSite,
      expires  = in_expires,
      session  = in_session,
      value    = in_value
    WHERE userId = uid
      AND domain = in_domain
      AND path   = in_path
      AND name   = in_name;

  IF ROW_COUNT() = 0 THEN
    
    INSERT INTO Cookies (
      userId, domain, path,
      secure, httpOnly, sameSite,
      expires, session, name, value
    ) VALUES (
      uid, in_domain, in_path,
      in_secure, in_httpOnly, in_sameSite,
      in_expires, in_session, in_name, in_value
    );
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-28 21:54:07
