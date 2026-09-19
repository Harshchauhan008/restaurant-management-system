package com.restaurant.backend.Controller;

import com.restaurant.backend.dto.CreateOrderRequest;
import com.restaurant.backend.dto.OrderResponse;
import com.restaurant.backend.Service.OrderService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class PublicOrderController {

    private final OrderService orderService;

    public PublicOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(
            @RequestBody CreateOrderRequest request
    ) {
        return orderService.createOrder(request);
    }
}