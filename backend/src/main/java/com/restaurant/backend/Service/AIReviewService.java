package com.restaurant.backend.Service;

import com.restaurant.backend.Repository.OrderItemRepository;
import com.restaurant.backend.Repository.OrderRepository;

import com.restaurant.backend.dto.AIReviewSuggestionRequest;
import com.restaurant.backend.dto.AIReviewSuggestionResponse;

import com.restaurant.backend.entity.Order;
import com.restaurant.backend.entity.OrderItem;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.StringJoiner;

@Service
public class AIReviewService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    private final Random random = new Random();

    public AIReviewService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public AIReviewSuggestionResponse generateSuggestion(
            AIReviewSuggestionRequest request
    ) {

        if (request.getOrderId() == null) {
            throw new RuntimeException(
                    "Order ID is required"
            );
        }

        if (request.getRating() == null ||
                request.getRating() < 1 ||
                request.getRating() > 5) {

            throw new RuntimeException(
                    "Rating must be between 1 and 5"
            );
        }

        Order order =
                orderRepository.findById(
                        request.getOrderId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Order not found"
                        )
                );

        if (order.getStatus().name()
                .equals("COMPLETED") == false) {

            throw new RuntimeException(
                    "AI review suggestions are only available for completed orders"
            );
        }

        List<OrderItem> orderItems =
                orderItemRepository
                        .findByOrderId(
                                order.getId()
                        );

        if (orderItems.isEmpty()) {
            throw new RuntimeException(
                    "Order has no items"
            );
        }

        StringJoiner itemNames =
                new StringJoiner(", ");

        for (OrderItem item : orderItems) {

            itemNames.add(
                    item.getMenuItem()
                            .getName()
            );
        }

        String items =
                itemNames.toString();

        String style =
                chooseStyle();

        String suggestion =
                buildSuggestion(
                        items,
                        request.getRating(),
                        style
                );

        return new AIReviewSuggestionResponse(
                suggestion
        );
    }

    private String chooseStyle() {

        String[] styles = {
                "friendly",
                "casual",
                "warm",
                "enthusiastic",
                "simple",
                "natural"
        };

        return styles[
                random.nextInt(
                        styles.length
                )
        ];
    }

    private String buildSuggestion(
            String items,
            Integer rating,
            String style
    ) {

        if (rating == 5) {

            return switch (style) {

                case "friendly" ->
                        "Really enjoyed my visit! The "
                                + items
                                + " were delicious and "
                                + "made the experience memorable.";

                case "casual" ->
                        "Had a great time here. The "
                                + items
                                + " were really good and "
                                + "I would happily come back.";

                case "warm" ->
                        "I had a wonderful experience "
                                + "and really enjoyed the "
                                + items
                                + ". Everything felt lovely "
                                + "and satisfying.";

                case "enthusiastic" ->
                        "Absolutely loved the "
                                + items
                                + "! Great experience and "
                                + "definitely worth trying.";

                case "simple" ->
                        "Great experience. The "
                                + items
                                + " were delicious.";

                default ->
                        "I really enjoyed the "
                                + items
                                + " and had a great overall experience.";
            };
        }

        if (rating == 4) {

            return switch (style) {

                case "friendly" ->
                        "I had a very good experience. "
                                + "The "
                                + items
                                + " were tasty and enjoyable.";

                case "casual" ->
                        "Pretty good experience overall. "
                                + "I liked the "
                                + items
                                + " and would come again.";

                case "warm" ->
                        "A pleasant dining experience. "
                                + "The "
                                + items
                                + " were enjoyable.";

                case "enthusiastic" ->
                        "Really enjoyed the "
                                + items
                                + "! A very nice experience overall.";

                case "simple" ->
                        "Good food and a good experience. "
                                + "I enjoyed the "
                                + items
                                + ".";

                default ->
                        "The "
                                + items
                                + " were good and I enjoyed my visit.";
            };
        }

        if (rating == 3) {

            return "I had a decent experience and enjoyed "
                    + "the "
                    + items
                    + ". There are a few things that could "
                    + "be improved, but overall it was okay.";
        }

        if (rating == 2) {

            return "The "
                    + items
                    + " were okay, but I think there is "
                    + "room for improvement in the overall experience.";
        }

        return "I tried the "
                + items
                + ". The experience could be improved "
                + "in a few areas.";
    }
}