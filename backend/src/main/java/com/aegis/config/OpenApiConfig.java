package com.aegis.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI aegisOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Aegis-ICU Clinical Core & Multi-Agent Surveillance API")
                        .version("1.0.0")
                        .description("REST API for the Aegis-ICU Multi-Agent Sepsis Surveillance & Clinical Decision Support System.\n\n" +
                                "### Default Test Credentials:\n" +
                                "- **Attending Physician**: Username `dr.munawar` | Password `monu2007` (Role: `ROLE_DOCTOR`)\n" +
                                "- **Bedside Nurse**: Username `nurse.priya` | Password `Nurse123!` (Role: `ROLE_NURSE`)\n\n" +
                                "### Instructions to Authorize:\n" +
                                "1. Call `POST /api/v1/auth/login` with credentials above.\n" +
                                "2. Copy the returned `token`.\n" +
                                "3. Click the green **Authorize** button at the top right of this Swagger UI.\n" +
                                "4. Paste your token (without 'Bearer') and click **Authorize**.")
                        .contact(new Contact().name("Aegis-ICU Clinical AI Team").email("aegis.icu.alerts@gmail.com"))
                        .license(new License().name("Apache 2.0").url("https://www.apache.org/licenses/LICENSE-2.0")))
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", new SecurityScheme()
                                .name("BearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT Bearer token obtained from /api/v1/auth/login")));
    }
}
