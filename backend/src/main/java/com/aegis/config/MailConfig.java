package com.aegis.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

@Configuration
@Slf4j
public class MailConfig {

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String host;

    @Value("${spring.mail.port:587}")
    private int port;

    @Value("${spring.mail.username:openquest7@gmail.com}")
    private String username;

    @Value("${spring.mail.password:}")
    private String configuredPassword;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host);
        mailSender.setPort(port);

        // Multi-tier secure credential resolution:
        // Tier 1: OS Environment variables (e.g. Docker, Kubernetes, CI/CD)
        // Tier 2: Gitignored .env file in backend/ or root
        // Tier 3: Spring application properties
        String resolvedUsername = System.getenv("SPRING_MAIL_USERNAME");
        if (resolvedUsername == null || resolvedUsername.isBlank()) {
            resolvedUsername = loadKeyFromDotEnv("SPRING_MAIL_USERNAME");
        }
        if (resolvedUsername == null || resolvedUsername.isBlank()) {
            resolvedUsername = username;
        }

        String resolvedPassword = System.getenv("SPRING_MAIL_PASSWORD");
        if (resolvedPassword == null || resolvedPassword.isBlank()) {
            resolvedPassword = loadKeyFromDotEnv("SPRING_MAIL_PASSWORD");
        }
        if (resolvedPassword == null || resolvedPassword.isBlank()) {
            resolvedPassword = configuredPassword;
        }

        if (resolvedPassword != null) {
            resolvedPassword = resolvedPassword.trim();
            // Google App Passwords are commonly formatted with spaces (e.g. 16 chars in groups of 4)
            if (resolvedPassword.replace(" ", "").length() == 16) {
                resolvedPassword = resolvedPassword.replace(" ", "");
            }
        }

        mailSender.setUsername(resolvedUsername);
        mailSender.setPassword(resolvedPassword);
        mailSender.setDefaultEncoding("UTF-8");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");
        props.put("mail.smtp.writetimeout", "5000");

        log.info("📧 [MAIL CONFIG] Real Gmail SMTP configured for '{}' on {}:{} (STARTTLS enabled)",
                resolvedUsername, host, port);

        return mailSender;
    }

    private String loadKeyFromDotEnv(String key) {
        String[] possiblePaths = {"./backend/.env", "./.env", "../.env", ".env"};
        for (String path : possiblePaths) {
            File envFile = new File(path);
            if (envFile.exists() && envFile.isFile()) {
                try (FileInputStream fis = new FileInputStream(envFile)) {
                    Properties envProps = new Properties();
                    envProps.load(fis);
                    String val = envProps.getProperty(key);
                    if (val != null && !val.isBlank()) {
                        return val.trim();
                    }
                } catch (Exception e) {
                    log.warn("Failed reading key {} from {}: {}", key, path, e.getMessage());
                }
            }
        }
        return null;
    }
}

