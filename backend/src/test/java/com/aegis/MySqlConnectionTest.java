package com.aegis;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:mysql://localhost:3306/aegis_icu?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true",
    "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
    "spring.datasource.username=root",
    "spring.datasource.password=monu2007",
    "spring.jpa.hibernate.ddl-auto=update",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect"
})
@org.junit.jupiter.api.Disabled("Optional live MySQL test requires running local MySQL service on port 3306")
public class MySqlConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Verify live MySQL aegis_icu database connection and metadata")
    void testLiveMySqlConnection() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertTrue(connection.isValid(2), "Database connection must be valid");
            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("CONNECTED TO DATABASE: " + metaData.getDatabaseProductName() + " " + metaData.getDatabaseProductVersion());
            System.out.println("DATABASE URL: " + metaData.getURL());
            System.out.println("DATABASE USER: " + metaData.getUserName());
        }
    }
}
