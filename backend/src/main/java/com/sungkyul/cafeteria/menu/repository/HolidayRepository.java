package com.sungkyul.cafeteria.menu.repository;

import com.sungkyul.cafeteria.menu.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    boolean existsByHolidayDate(LocalDate holidayDate);

    List<Holiday> findByHolidayDateBetween(LocalDate start, LocalDate end);
}
