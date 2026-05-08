const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.type = "button";
    menuBtn.setAttribute("aria-expanded", "false");

    menuBtn.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
    });
}

const modalContactForm = document.querySelector("#modalContactForm");
const pageContactForm = document.querySelector("#contactForm");
const successPopup = document.getElementById("formSuccessPopup");
const successPopupText = document.getElementById("successPopupText");
const successPopupClose = document.getElementById("successPopupClose");
const successPopupOverlay = document.getElementById("successPopupOverlay");

function showSuccessPopup(message) {
    if (!successPopup || !successPopupText) return;
    successPopupText.textContent = message;
    successPopup.classList.add("open");
    successPopup.setAttribute("aria-hidden", "false");
}

function closeSuccessPopup() {
    if (!successPopup) return;
    successPopup.classList.remove("open");
    successPopup.setAttribute("aria-hidden", "true");
}

if (successPopupClose) {
    successPopupClose.addEventListener("click", closeSuccessPopup);
}

if (successPopupOverlay) {
    successPopupOverlay.addEventListener("click", closeSuccessPopup);
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeSuccessPopup();
    }
});

async function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitBtn = form.querySelector("button[type='submit']");
    const successMessage = form.querySelector(".form-success");
    if (!submitBtn) return;

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Sending...";

    const formData = new FormData(form);

    try {
        const response = await fetch(form.action, {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            if (typeof calendar !== "undefined" && calendar.closeContactModal) {
                calendar.closeContactModal();
            }
            showSuccessPopup("Thank you! We will get back to you shortly.");
            form.reset();
        } else {
            const result = await response.json();
            const errorText = result.error || "Submission failed. Please try again.";
            if (successMessage) {
                successMessage.hidden = false;
                successMessage.style.color = "#b00020";
                successMessage.textContent = errorText;
            }
        }
    } catch (error) {
        if (successMessage) {
            successMessage.hidden = false;
            successMessage.style.color = "#b00020";
            successMessage.textContent = "Unable to send. Please check your connection and try again.";
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

if (modalContactForm) {
    modalContactForm.addEventListener("submit", handleFormSubmit);
}

if (pageContactForm) {
    pageContactForm.addEventListener("submit", handleFormSubmit);
}

// Calendar functionality
const calendar = {
    currentDate: new Date(),
    selectedDate: null,
    // Define unavailable dates (YYYY-MM-DD format)
    unavailableDates: [
        "2026-05-10"
    ],

    getDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    parseDateString(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    init() {
        const monthYearElem = document.getElementById("monthYear");
        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");
        const bookBtn = document.getElementById("bookBtn");

        if (!monthYearElem || !prevBtn || !nextBtn || !bookBtn) return;

        prevBtn.addEventListener("click", () => this.previousMonth());
        nextBtn.addEventListener("click", () => this.nextMonth());
        bookBtn.addEventListener("click", () => this.openContactModal());

        const closeModalBtn = document.getElementById("closeModalBtn");
        const modalOverlay = document.querySelector(".modal-overlay");

        if (closeModalBtn) {
            closeModalBtn.addEventListener("click", () => this.closeContactModal());
        }

        if (modalOverlay) {
            modalOverlay.addEventListener("click", () => this.closeContactModal());
        }

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                this.closeContactModal();
            }
        });

        this.render();
    },

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    },

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    },

    isDateUnavailable(date) {
        const dateStr = this.getDateString(date);
        return this.unavailableDates.includes(dateStr);
    },

    isToday(date) {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    },

    render() {
        const monthYearElem = document.getElementById("monthYear");
        const calendarDaysElem = document.getElementById("calendarDays");

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Set month and year heading
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        monthYearElem.textContent = `${monthNames[month]} ${year}`;

        // Clear previous days
        calendarDaysElem.innerHTML = "";

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Add days from previous month
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayElem = document.createElement("div");
            dayElem.className = "day other-month";
            dayElem.textContent = daysInPrevMonth - i;
            calendarDaysElem.appendChild(dayElem);
        }

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElem = document.createElement("div");
            const dateStr = this.getDateString(date);

            dayElem.className = "day";
            dayElem.textContent = day;

            if (this.isDateUnavailable(date)) {
                dayElem.classList.add("unavailable");
            } else {
                dayElem.classList.add("available");
                dayElem.addEventListener("click", () => this.selectDate(dateStr, dayElem));
            }

            if (this.isToday(date)) {
                dayElem.classList.add("today");
            }

            if (this.selectedDate === dateStr) {
                dayElem.classList.add("selected");
            }

            calendarDaysElem.appendChild(dayElem);
        }

        // Add days from next month
        const totalCells = calendarDaysElem.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayElem = document.createElement("div");
            dayElem.className = "day other-month";
            dayElem.textContent = day;
            calendarDaysElem.appendChild(dayElem);
        }
    },

    selectDate(dateStr, dayElem) {
        // Remove previous selection
        const previousSelected = document.querySelector(".day.selected");
        if (previousSelected) {
            previousSelected.classList.remove("selected");
        }

        // Set new selection
        this.selectedDate = dateStr;
        dayElem.classList.add("selected");

        // Update display using local date parsing
        const date = this.parseDateString(dateStr);
        const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
        document.getElementById("selectedDate").textContent = date.toLocaleDateString("en-US", options);
    },

    openContactModal() {
        const modal = document.getElementById("contactModal");
        const modalSelectedDate = document.getElementById("modalSelectedDate");
        const modalSelectedDateField = document.getElementById("modalSelectedDateField");
        const selectedDateText = this.selectedDate || "None";

        if (modalSelectedDate) {
            modalSelectedDate.textContent = selectedDateText;
        }

        if (modalSelectedDateField) {
            modalSelectedDateField.value = this.selectedDate || "";
        }

        if (modal) {
            modal.classList.add("open");
            modal.setAttribute("aria-hidden", "false");
        }
    },

    closeContactModal() {
        const modal = document.getElementById("contactModal");
        if (modal) {
            modal.classList.remove("open");
            modal.setAttribute("aria-hidden", "true");
        }
    }
};

// Initialize calendar when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => calendar.init());
} else {
    calendar.init();
}
