package com.restaurant.backend.Config;

import com.restaurant.backend.Repository.RestaurantSettingsRepository;
import com.restaurant.backend.entity.RestaurantSettings;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RestaurantSettingsInitializer {

    @Bean
    CommandLineRunner initializeRestaurantSettings(
            RestaurantSettingsRepository repository
    ) {

        return args -> {

            if (repository.count() == 0) {

                RestaurantSettings settings =
                        new RestaurantSettings();

                settings.setRestaurantName(
                        "THE LOOKOUT CAFE"
                );

                settings.setLogoUrl(
                        null
                );

                settings.setAddress(
                        "Your restaurant address"
                );

                settings.setPhone(
                        "Your phone number"
                );

                settings.setOpeningHours(
                        "10:00 AM - 11:00 PM"
                );

                settings.setTaxPercentage(
                        0.0
                );

                settings.setReceiptHeader(
                        "THE LOOKOUT CAFE"
                );

                settings.setReceiptFooter(
                        "THANK YOU!\nVISIT AGAIN"
                );

                repository.save(settings);
            }
        };
    }
}