package com.stocks.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI stockOpenAPI(
            @Value("${app.service-name}") String serviceName,
            @Value("${app.version}") String version) {
        return new OpenAPI()
                .info(new Info()
                        .title(serviceName)
                        .version(version)
                        .description("REST API for managing stocks and prices"));
    }
}
