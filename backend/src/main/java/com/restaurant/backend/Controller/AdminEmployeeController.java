package com.restaurant.backend.Controller;

import com.restaurant.backend.dto.CreateEmployeeRequest;
import com.restaurant.backend.dto.EmployeeResponse;
import com.restaurant.backend.dto.ResetEmployeePasswordRequest;
import com.restaurant.backend.dto.UpdateEmployeeRequest;
import com.restaurant.backend.Service.AdminEmployeeService;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/employees")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmployeeController {

    private final AdminEmployeeService employeeService;

    public AdminEmployeeController(
            AdminEmployeeService employeeService
    ) {
        this.employeeService = employeeService;
    }


    // =====================================================
    // CREATE EMPLOYEE
    // =====================================================

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmployeeResponse createEmployee(
            @RequestBody CreateEmployeeRequest request
    ) {

        return employeeService.createEmployee(
                request
        );
    }


    // =====================================================
    // GET ALL EMPLOYEES
    // =====================================================

    @GetMapping
    public List<EmployeeResponse> getEmployees() {

        return employeeService.getAllEmployees();
    }


    // =====================================================
    // UPDATE EMPLOYEE
    // =====================================================

    @PutMapping("/{id}")
    public EmployeeResponse updateEmployee(
            @PathVariable Long id,
            @RequestBody UpdateEmployeeRequest request
    ) {

        return employeeService.updateEmployee(
                id,
                request
        );
    }


    // =====================================================
    // RESET EMPLOYEE PASSWORD
    // ADMIN ONLY
    // =====================================================

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetEmployeePassword(
            @PathVariable Long id,
            @RequestBody ResetEmployeePasswordRequest request
    ) {

        employeeService.resetEmployeePassword(
                id,
                request
        );
    }


    // =====================================================
    // DISABLE EMPLOYEE
    // =====================================================

    @PatchMapping("/{id}/disable")
    public String disableEmployee(
            @PathVariable Long id
    ) {

        employeeService.disableEmployee(id);

        return "Employee disabled successfully";
    }
}