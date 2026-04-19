package com.sungkyul.cafeteria.common.config;

import org.flywaydb.core.api.MigrationInfo;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * dev 환경에서 마이그레이션 파일 수정 후 체크섬 불일치가 생길 때 자동으로 repair → migrate.
 * prod 프로파일에서는 활성화되지 않으므로 운영 DB에는 영향 없음.
 */
@Configuration
@Profile("dev")
class DevFlywayConfig {

    @Bean
    FlywayMigrationStrategy repairAndMigrate() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
