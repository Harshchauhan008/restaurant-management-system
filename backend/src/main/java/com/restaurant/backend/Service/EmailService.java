package com.restaurant.backend.Service;

import com.restaurant.backend.entity.Reservation;
import com.restaurant.backend.entity.User;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(
            JavaMailSender mailSender
    ) {
        this.mailSender = mailSender;
    }

    // =====================================================
    // SEND RESERVATION CONFIRMATION
    // =====================================================

    public void sendReservationConfirmation(
            Reservation reservation
    ) {

        if (reservation == null) {
            return;
        }

        String customerEmail =
                reservation.getCustomerEmail();

        if (customerEmail == null ||
                customerEmail.isBlank()) {

            return;
        }

        String tableNumber =
                reservation.getTable() != null
                        ? reservation.getTable()
                            .getTableNumber()
                        : "N/A";

        String subject =
                "Reservation Confirmed - " +
                        reservation.getReservationNumber();

        String message =
                "Dear " +
                        reservation.getCustomerName() +
                        ",\n\n" +

                "Your table reservation has been confirmed.\n\n" +

                "Reservation Details\n" +
                "--------------------------\n" +

                "Reservation Number: " +
                        reservation.getReservationNumber() +
                        "\n" +

                "Guest Name: " +
                        reservation.getCustomerName() +
                        "\n" +

                "Phone: " +
                        reservation.getCustomerPhone() +
                        "\n" +

                "Date: " +
                        reservation.getReservationDate() +
                        "\n" +

                "Time: " +
                        reservation.getReservationTime() +
                        "\n" +

                "Table: " +
                        tableNumber +
                        "\n" +

                "Guests: " +
                        reservation.getPartySize() +
                        "\n\n" +

                "Please show this confirmation email " +
                "when you arrive at the restaurant.\n\n" +

                "We look forward to serving you!\n\n" +

                "Thank you.";

        SimpleMailMessage mail =
                new SimpleMailMessage();

        mail.setFrom(fromEmail);
        mail.setTo(customerEmail);
        mail.setSubject(subject);
        mail.setText(message);

        mailSender.send(mail);
    }

    // =====================================================
// SEND ADMIN PASSWORD RESET EMAIL
// =====================================================

public void sendAdminPasswordResetEmail(
        User admin,
        String resetLink
) {

    if (admin == null ||
            admin.getEmail() == null ||
            admin.getEmail().isBlank()) {

        return;
    }

    String subject =
            "Reset Your Admin Password - The Lookout";

    String message =
            "Dear " +
                    admin.getFullName() +
                    ",\n\n" +

            "We received a request to reset your " +
            "The Lookout admin account password.\n\n" +

            "Account Details\n" +
            "--------------------------\n" +

            "Name: " +
                    admin.getFullName() +
                    "\n" +

            "Employee ID: " +
                    admin.getEmployeeId() +
                    "\n" +

            "Role: " +
                    admin.getRole().name() +
                    "\n\n" +

            "Click the link below to create a new password:\n\n" +

            resetLink +
                    "\n\n" +

            "This password reset link will expire in 15 minutes.\n\n" +

            "If you did not request a password reset, " +
            "you can safely ignore this email.\n\n" +

            "For security reasons, do not share this link " +
            "with anyone.\n\n" +

            "Regards,\n" +
            "The Lookout";

    SimpleMailMessage mail =
            new SimpleMailMessage();

    mail.setFrom(fromEmail);
    mail.setTo(admin.getEmail());
    mail.setSubject(subject);
    mail.setText(message);

    mailSender.send(mail);
        }
}