// ===== GLOBAL VARIABLES & CONSTANTS =====
const CONSTANTS = {
    MOBILE_BREAKPOINT: 768,
    TOAST_DURATION: 4000,
    ANIMATION_DURATION: 300,
    BOOKING_SIMULATION_DELAY: 2000,
    CONTACT_SIMULATION_DELAY: 1500
};

// ===== UTILITY FUNCTIONS =====
const utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    },

    // Check if device is mobile
    isMobile() {
        return window.innerWidth <= CONSTANTS.MOBILE_BREAKPOINT;
    },

    // Smooth scroll to element
    smoothScrollTo(element) {
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    // Generate unique ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    // Format phone number for display
    formatPhoneNumber(phone) {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{5})(\d{5})/, '+91 $1 $2');
        }
        return phone;
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate phone number format
    isValidPhone(phone) {
        const phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
};

// ===== TOAST NOTIFICATION SYSTEM =====
class ToastManager {
    constructor() {
        this.toastElement = document.getElementById('toast');
        this.toastMessage = this.toastElement?.querySelector('.toast-message');
        this.toastIcon = this.toastElement?.querySelector('.toast-icon');
        this.currentTimeout = null;
    }

    show(message, type = 'success', duration = CONSTANTS.TOAST_DURATION) {
        if (!this.toastElement) return;

        // Clear existing timeout
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }

        // Set message and icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const colors = {
            success: '#2B8A3E',
            error: '#C92A2A',
            warning: '#E8590C',
            info: '#1971C2'
        };

        if (this.toastMessage) this.toastMessage.textContent = message;
        if (this.toastIcon) this.toastIcon.textContent = icons[type];
        this.toastElement.style.backgroundColor = colors[type];

        // Show toast
        this.toastElement.classList.add('show');
        this.toastElement.setAttribute('aria-hidden', 'false');

        // Hide after duration
        this.currentTimeout = setTimeout(() => {
            this.hide();
        }, duration);
    }

    hide() {
        if (this.toastElement) {
            this.toastElement.classList.remove('show');
            this.toastElement.setAttribute('aria-hidden', 'true');
        }
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
            this.currentTimeout = null;
        }
    }
}

// ===== THEME MANAGER =====
class ThemeManager {
    constructor() {
        this.themeToggle = document.querySelector('.theme-toggle');
        this.themeIcon = document.querySelector('.theme-icon');
        this.currentTheme = this.getStoredTheme() || this.getPreferredTheme();
        
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    getPreferredTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
        
        if (this.themeToggle) {
            this.themeToggle.setAttribute('aria-label', 
                `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.setStoredTheme(newTheme);
    }
}

// ===== NAVIGATION MANAGER =====
class NavigationManager {
    constructor() {
        this.navToggle = document.querySelector('.nav-toggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.header = document.querySelector('.header');
        
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        // Mobile menu toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
        }

        // Close menu when clicking nav links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (utils.isMobile() && this.isMenuOpen) {
                    this.closeMenu();
                }
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.navMenu?.contains(e.target) && !this.navToggle?.contains(e.target)) {
                this.closeMenu();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.closeMenu();
                this.navToggle?.focus();
            }
        });

        // Handle scroll for header transparency
        this.handleScroll();
        window.addEventListener('scroll', utils.throttle(() => {
            this.handleScroll();
        }, 10));

        // Handle resize
        window.addEventListener('resize', utils.debounce(() => {
            if (!utils.isMobile() && this.isMenuOpen) {
                this.closeMenu();
            }
        }, 250));

        // Set up smooth scrolling for anchor links
        this.setupSmoothScrolling();

        // Set up focus trapping for mobile menu
        this.setupFocusTrapping();
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (this.navMenu && this.navToggle) {
            this.navMenu.classList.add('active');
            this.navToggle.classList.add('active');
            this.navToggle.setAttribute('aria-expanded', 'true');
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            this.isMenuOpen = true;

            // Focus first menu item
            const firstLink = this.navMenu.querySelector('.nav-link');
            if (firstLink) {
                setTimeout(() => firstLink.focus(), 100);
            }
        }
    }

    closeMenu() {
        if (this.navMenu && this.navToggle) {
            this.navMenu.classList.remove('active');
            this.navToggle.classList.remove('active');
            this.navToggle.setAttribute('aria-expanded', 'false');
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            this.isMenuOpen = false;
        }
    }

    handleScroll() {
        if (this.header) {
            const scrolled = window.scrollY > 50;
            this.header.style.backgroundColor = scrolled 
                ? 'rgba(250, 247, 242, 0.95)' 
                : 'rgba(250, 247, 242, 0.95)';
                
            // Update for dark theme
            if (document.documentElement.getAttribute('data-theme') === 'dark') {
                this.header.style.backgroundColor = scrolled 
                    ? 'rgba(17, 18, 23, 0.95)' 
                    : 'rgba(17, 18, 23, 0.95)';
            }
        }
    }

    setupSmoothScrolling() {
        // Handle smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                
                // Skip if it's just "#" or empty
                if (!href || href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    
                    // Close mobile menu if open
                    if (this.isMenuOpen) {
                        this.closeMenu();
                    }
                    
                    // Scroll to target with offset for fixed header
                    const headerOffset = 100;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    setupFocusTrapping() {
        // Get all focusable elements in the menu
        const getFocusableElements = () => {
            if (!this.navMenu) return [];
            return this.navMenu.querySelectorAll(
                'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
            );
        };

        // Handle tab key for focus trapping
        document.addEventListener('keydown', (e) => {
            if (!this.isMenuOpen || e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        });
    }
}

// ===== FORM VALIDATION MANAGER =====
class FormValidator {
    constructor() {
        this.validators = {
            required: (value) => value.trim().length > 0,
            email: (value) => utils.isValidEmail(value),
            phone: (value) => utils.isValidPhone(value),
            minLength: (value, min) => value.length >= min
        };
    }

    validateField(field, rules = []) {
        const value = field.value.trim();
        const errorElement = document.getElementById(`${field.id}-error`);
        
        for (const rule of rules) {
            if (!this.validators[rule.type]) continue;
            
            const isValid = rule.params 
                ? this.validators[rule.type](value, rule.params)
                : this.validators[rule.type](value);
                
            if (!isValid) {
                this.showError(field, errorElement, rule.message);
                return false;
            }
        }
        
        this.clearError(field, errorElement);
        return true;
    }

    showError(field, errorElement, message) {
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('error');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearError(field, errorElement) {
        field.setAttribute('aria-invalid', 'false');
        field.classList.remove('error');
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    validateForm(formElement, fieldRules) {
        let isFormValid = true;
        
        for (const [fieldId, rules] of Object.entries(fieldRules)) {
            const field = document.getElementById(fieldId);
            if (field) {
                const isFieldValid = this.validateField(field, rules);
                if (!isFieldValid) {
                    isFormValid = false;
                }
            }
        }
        
        return isFormValid;
    }
}

// ===== BOOKING FORM MANAGER =====
class BookingManager {
    constructor() {
        this.form = document.getElementById('bookingForm');
        this.validator = new FormValidator();
        this.toast = new ToastManager();
        
        this.fieldRules = {
            clientName: [
                { type: 'required', message: 'Please enter your full name' },
                { type: 'minLength', params: 2, message: 'Name must be at least 2 characters long' }
            ],
            clientPhone: [
                { type: 'required', message: 'Please enter your phone number' },
                { type: 'phone', message: 'Please enter a valid phone number' }
            ],
            clientEmail: [
                { type: 'required', message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' }
            ],
            service: [
                { type: 'required', message: 'Please select a service' }
            ],
            preferredDate: [
                { type: 'required', message: 'Please select your preferred date' }
            ],
            preferredTime: [
                { type: 'required', message: 'Please select your preferred time' }
            ]
        };
        
        this.init();
    }

    init() {
        if (!this.form) return;

        // Set minimum date to today
        const dateField = document.getElementById('preferredDate');
        if (dateField) {
            const today = new Date().toISOString().split('T')[0];
            dateField.setAttribute('min', today);
        }

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        Object.keys(this.fieldRules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validator.validateField(field, this.fieldRules[fieldId]);
                });
                
                field.addEventListener('input', utils.debounce(() => {
                    if (field.getAttribute('aria-invalid') === 'true') {
                        this.validator.validateField(field, this.fieldRules[fieldId]);
                    }
                }, 300));
            }
        });

        // Phone number formatting
        const phoneField = document.getElementById('clientPhone');
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                // Remove all non-digits
                let value = e.target.value.replace(/\D/g, '');
                
                // Add +91 prefix if not present and format
                if (value.length > 0) {
                    if (value.startsWith('91') && value.length === 12) {
                        value = value.substring(2);
                    }
                    if (value.length === 10) {
                        e.target.value = `+91 ${value.substring(0, 5)} ${value.substring(5)}`;
                    }
                }
            });
        }
    }

    async handleSubmit() {
        // Validate form
        const isValid = this.validator.validateForm(this.form, this.fieldRules);
        
        if (!isValid) {
            this.toast.show('Please correct the errors in the form', 'error');
            
            // Focus first error field
            const firstError = this.form.querySelector('[aria-invalid="true"]');
            if (firstError) {
                firstError.focus();
            }
            return;
        }

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API call
            await this.simulateBooking();
            
            // Get form data
            const formData = new FormData(this.form);
            const bookingData = Object.fromEntries(formData.entries());
            
            // Store booking for demo purposes
            this.storeBooking(bookingData);
            
            // Show success message
            this.toast.show(
                `Booking confirmed! We'll call you at ${bookingData.clientPhone} to confirm your appointment.`,
                'success',
                6000
            );
            
            // Reset form
            this.form.reset();
            
            // Reset date minimum
            const dateField = document.getElementById('preferredDate');
            if (dateField) {
                const today = new Date().toISOString().split('T')[0];
                dateField.setAttribute('min', today);
            }
            
        } catch (error) {
            this.toast.show('Something went wrong. Please try again or call us directly.', 'error');
            console.error('Booking error:', error);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    setLoadingState(button, loading) {
        if (!button) return;
        
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-flex';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (btnText) btnText.style.display = 'inline-flex';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    async simulateBooking() {
        return new Promise((resolve) => {
            setTimeout(resolve, CONSTANTS.BOOKING_SIMULATION_DELAY);
        });
    }

    storeBooking(data) {
        try {
            const bookings = JSON.parse(localStorage.getItem('cutCrownBookings') || '[]');
            bookings.push({
                ...data,
                id: utils.generateId(),
                timestamp: new Date().toISOString(),
                status: 'pending'
            });
            localStorage.setItem('cutCrownBookings', JSON.stringify(bookings));
        } catch (error) {
            console.warn('Could not store booking locally:', error);
        }
    }
}

// ===== CONTACT FORM MANAGER =====
class ContactManager {
    constructor() {
        this.form = document.getElementById('contactForm');
        this.validator = new FormValidator();
        this.toast = new ToastManager();
        
        this.fieldRules = {
            contactName: [
                { type: 'required', message: 'Please enter your name' },
                { type: 'minLength', params: 2, message: 'Name must be at least 2 characters long' }
            ],
            contactEmail: [
                { type: 'required', message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' }
            ],
            contactSubject: [
                { type: 'required', message: 'Please select a subject' }
            ],
            contactMessage: [
                { type: 'required', message: 'Please enter your message' },
                { type: 'minLength', params: 10, message: 'Message must be at least 10 characters long' }
            ]
        };
        
        this.init();
    }

    init() {
        if (!this.form) return;

        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Real-time validation
        Object.keys(this.fieldRules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => {
                    this.validator.validateField(field, this.fieldRules[fieldId]);
                });
                
                field.addEventListener('input', utils.debounce(() => {
                    if (field.getAttribute('aria-invalid') === 'true') {
                        this.validator.validateField(field, this.fieldRules[fieldId]);
                    }
                }, 300));
            }
        });

        // Phone number formatting (optional field)
        const phoneField = document.getElementById('contactPhone');
        if (phoneField) {
            phoneField.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 0) {
                    if (value.startsWith('91') && value.length === 12) {
                        value = value.substring(2);
                    }
                    if (value.length === 10) {
                        e.target.value = `+91 ${value.substring(0, 5)} ${value.substring(5)}`;
                    }
                }
            });
        }
    }

    async handleSubmit() {
        // Validate form
        const isValid = this.validator.validateForm(this.form, this.fieldRules);
        
        if (!isValid) {
            this.toast.show('Please correct the errors in the form', 'error');
            
            // Focus first error field
            const firstError = this.form.querySelector('[aria-invalid="true"]');
            if (firstError) {
                firstError.focus();
            }
            return;
        }

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        this.setLoadingState(submitBtn, true);

        try {
            // Simulate API call
            await this.simulateContactSubmission();
            
            // Get form data
            const formData = new FormData(this.form);
            const contactData = Object.fromEntries(formData.entries());
            
            // Store contact message for demo purposes
            this.storeContactMessage(contactData);
            
            // Show success message
            this.toast.show(
                'Thank you for your message! We\'ll get back to you within 24 hours.',
                'success',
                5000
            );
            
            // Reset form
            this.form.reset();
            
        } catch (error) {
            this.toast.show('Something went wrong. Please try again or call us directly.', 'error');
            console.error('Contact form error:', error);
        } finally {
            this.setLoadingState(submitBtn, false);
        }
    }

    setLoadingState(button, loading) {
        if (!button) return;
        
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline-flex';
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (btnText) btnText.style.display = 'inline-flex';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    async simulateContactSubmission() {
        return new Promise((resolve) => {
            setTimeout(resolve, CONSTANTS.CONTACT_SIMULATION_DELAY);
        });
    }

    storeContactMessage(data) {
        try {
            const messages = JSON.parse(localStorage.getItem('cutCrownMessages') || '[]');
            messages.push({
                ...data,
                id: utils.generateId(),
                timestamp: new Date().toISOString(),
                status: 'new'
            });
            localStorage.setItem('cutCrownMessages', JSON.stringify(messages));
        } catch (error) {
            console.warn('Could not store message locally:', error);
        }
    }
}

// ===== GALLERY MANAGER =====
class GalleryManager {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightbox-image');
        this.lightboxTitle = document.getElementById('lightbox-title');
        this.lightboxDescription = document.getElementById('lightbox-description');
        
        this.currentIndex = 0;
        this.filteredItems = Array.from(this.galleryItems);
        
        this.init();
    }

    init() {
        if (!this.filterButtons.length && !this.galleryItems.length) return;

        // Filter functionality
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                this.filterGallery(filter);
                this.updateActiveFilter(button);
            });
        });

        // Gallery item click handlers
        this.galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                this.openLightbox(index);
            });
            
            // Keyboard accessibility
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openLightbox(index);
                }
            });
        });

        // Lightbox controls
        if (this.lightbox) {
            this.setupLightboxControls();
        }

        // Lazy loading for gallery images
        this.setupLazyLoading();
    }

    filterGallery(filter) {
        this.galleryItems.forEach(item => {
            const category = item.dataset.category;
            const shouldShow = filter === 'all' || category === filter;
            
            if (shouldShow) {
                item.classList.remove('hidden');
                item.style.display = 'block';
            } else {
                item.classList.add('hidden');
                setTimeout(() => {
                    if (item.classList.contains('hidden')) {
                        item.style.display = 'none';
                    }
                }, 300);
            }
        });

        // Update filtered items array for lightbox navigation
        this.filteredItems = Array.from(this.galleryItems).filter(item => 
            !item.classList.contains('hidden')
        );
    }

    updateActiveFilter(activeButton) {
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    openLightbox(index) {
        if (!this.lightbox) return;

        const item = this.filteredItems[index];
        if (!item) return;

        const img = item.querySelector('img');
        const overlay = item.querySelector('.gallery-overlay');
        
        if (!img) return;

        this.currentIndex = index;
        
        // Set image and info
        const fullSrc = img.dataset.full || img.src;
        this.lightboxImage.src = fullSrc;
        this.lightboxImage.alt = img.alt;
        
        if (overlay) {
            const title = overlay.querySelector('.gallery-title');
            const description = overlay.querySelector('.gallery-description');
            
            if (this.lightboxTitle && title) {
                this.lightboxTitle.textContent = title.textContent;
            }
            
            if (this.lightboxDescription && description) {
                this.lightboxDescription.textContent = description.textContent;
            }
        }

        // Show lightbox
        this.lightbox.classList.add('active');
        this.lightbox.setAttribute('aria-hidden', 'false');
        
        // Focus management
        const closeButton = this.lightbox.querySelector('.lightbox-close');
        if (closeButton) {
            closeButton.focus();
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Store the element that opened the lightbox for focus return
        this.previouslyFocusedElement = document.activeElement;
    }

    closeLightbox() {
        if (!this.lightbox) return;

        this.lightbox.classList.remove('active');
        this.lightbox.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to the previously focused element
        if (this.previouslyFocusedElement) {
            this.previouslyFocusedElement.focus();
            this.previouslyFocusedElement = null;
        }
    }

    navigateLightbox(direction) {
        const newIndex = direction === 'next' 
            ? (this.currentIndex + 1) % this.filteredItems.length
            : (this.currentIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
            
        this.openLightbox(newIndex);
    }

    setupLightboxControls() {
        // Close button
        const closeButton = this.lightbox.querySelector('.lightbox-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeLightbox();
            });
        }

        // Navigation buttons
        const prevButton = this.lightbox.querySelector('.lightbox-prev');
        const nextButton = this.lightbox.querySelector('.lightbox-next');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.navigateLightbox('prev');
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.navigateLightbox('next');
            });
        }

        // Click outside to close
        const overlay = this.lightbox.querySelector('.lightbox-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.closeLightbox();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active')) return;

            switch (e.key) {
                case 'Escape':
                    this.closeLightbox();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateLightbox('prev');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateLightbox('next');
                    break;
            }
        });

        // Focus trapping in lightbox
        this.setupLightboxFocusTrapping();
    }

    setupLightboxFocusTrapping() {
        document.addEventListener('keydown', (e) => {
            if (!this.lightbox.classList.contains('active') || e.key !== 'Tab') return;

            const focusableElements = this.lightbox.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    setupLazyLoading() {
        // Simple lazy loading implementation
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // Observe all gallery images
            this.galleryItems.forEach(item => {
                const img = item.querySelector('img');
                if (img && img.dataset.src) {
                    imageObserver.observe(img);
                }
            });
        }
    }
}

// ===== FAQ MANAGER =====
class FAQManager {
    constructor() {
        this.faqItems = document.querySelectorAll('.faq-item');
        this.init();
    }

    init() {
        if (!this.faqItems.length) return;

        this.faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (question && answer) {
                question.addEventListener('click', () => {
                    this.toggleFAQ(item, question, answer);
                });
                
                // Keyboard accessibility
                question.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.toggleFAQ(item, question, answer);
                    }
                });
            }
        });
    }

    toggleFAQ(item, question, answer) {
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        
        // Close all other FAQ items
        this.faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                const otherQuestion = otherItem.querySelector('.faq-question');
                const otherAnswer = otherItem.querySelector('.faq-answer');
                
                if (otherQuestion && otherAnswer) {
                    otherQuestion.setAttribute('aria-expanded', 'false');
                    otherAnswer.style.maxHeight = '0';
                    otherAnswer.style.paddingBottom = '0';
                }
            }
        });
        
        // Toggle current item
        if (isExpanded) {
            question.setAttribute('aria-expanded', 'false');
            answer.style.maxHeight = '0';
            answer.style.paddingBottom = '0';
        } else {
            question.setAttribute('aria-expanded', 'true');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            answer.style.paddingBottom = 'var(--space-lg)';
        }
    }
}

// ===== SERVICE CARD ANIMATIONS =====
class ServiceAnimations {
    constructor() {
        this.serviceCards = document.querySelectorAll('.service-card, .service-detail-card');
        this.init();
    }

    init() {
        if (!this.serviceCards.length) return;

        // Add intersection observer for animation on scroll
        if ('IntersectionObserver' in window) {
            const cardObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = Math.random() * 0.3 + 's';
                        entry.target.classList.add('animate-in');
                        cardObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });

            this.serviceCards.forEach(card => {
                cardObserver.observe(card);
            });
        }

        // Add CSS for animation
        this.addAnimationStyles();
    }

    addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .service-card, .service-detail-card {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }
            
            .service-card.animate-in, .service-detail-card.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            @media (prefers-reduced-motion: reduce) {
                .service-card, .service-detail-card {
                    opacity: 1;
                    transform: none;
                    transition: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ===== SCROLL ANIMATIONS =====
class ScrollAnimations {
    constructor() {
        this.animatedElements = document.querySelectorAll(
            '.hero-content, .section-title, .testimonial-card, .team-member, .value-item'
        );
        this.init();
    }

    init() {
        if (!this.animatedElements.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // Intersection Observer for scroll animations
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    animationObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '20px'
        });

        this.animatedElements.forEach(element => {
            animationObserver.observe(element);
        });

        this.addScrollAnimationStyles();
    }

    addScrollAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .hero-content {
                animation: heroSlideUp 1s ease-out;
            }
            
            .section-title, .testimonial-card, .team-member, .value-item {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }
            
            .section-title.animate-in, .testimonial-card.animate-in, 
            .team-member.animate-in, .value-item.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            .testimonial-card.animate-in {
                animation-delay: 0.1s;
            }
            
            .team-member.animate-in {
                animation-delay: 0.2s;
            }
            
            @keyframes heroSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ===== PERFORMANCE MONITOR =====
class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            this.logPerformanceMetrics();
        });

        // Monitor Core Web Vitals
        this.monitorWebVitals();
    }

    logPerformanceMetrics() {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0];
            
            if (navigation) {
                const metrics = {
                    loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
                    domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                };
                
                console.log('Performance Metrics:', metrics);
                
                // Store metrics for analytics (in a real app)
                this.storeMetrics(metrics);
            }
        }
    }

    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? Math.round(firstPaint.startTime) : null;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? Math.round(fcp.startTime) : null;
    }

    monitorWebVitals() {
        // Monitor Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', Math.round(lastEntry.startTime));
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                // Handle browsers that don't support LCP
                console.log('LCP monitoring not supported');
            }
        }
    }

    storeMetrics(metrics) {
        try {
            localStorage.setItem('cutCrownPerformance', JSON.stringify({
                ...metrics,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }));
        } catch (error) {
            console.warn('Could not store performance metrics:', error);
        }
    }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
class AccessibilityManager {
    constructor() {
        this.init();
    }

    init() {
        // Add skip navigation links
        this.enhanceSkipLinks();
        
        // Enhance focus management
        this.enhanceFocusManagement();
        
        // Add ARIA live regions
        this.setupLiveRegions();
        
        // Monitor and announce route changes (for SPA-like behavior)
        this.setupRouteAnnouncements();
        
        // Enhance form accessibility
        this.enhanceFormAccessibility();
    }

    enhanceSkipLinks() {
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    enhanceFocusManagement() {
        // Ensure focus is visible
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('using-keyboard');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('using-keyboard');
        });

        // Add focus styles for keyboard users
        const style = document.createElement('style');
        style.textContent = `
            body:not(.using-keyboard) *:focus {
                outline: none;
            }
            
            .using-keyboard *:focus {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    setupLiveRegions() {
        // Create aria-live regions for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-announcements';
        document.body.appendChild(liveRegion);

        // Add styles for screen reader only content
        const style = document.createElement('style');
        style.textContent = `
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(style);
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    setupRouteAnnouncements() {
        // Announce page changes for navigation
        const links = document.querySelectorAll('a[href^="/"], a[href$=".html"]');
        links.forEach(link => {
            link.addEventListener('click', () => {
                const linkText = link.textContent.trim();
                setTimeout(() => {
                    this.announceToScreenReader(`Navigated to ${linkText}`);
                }, 100);
            });
        });
    }

    enhanceFormAccessibility() {
        // Add required field indicators
        const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
        requiredFields.forEach(field => {
            const label = document.querySelector(`label[for="${field.id}"]`);
            if (label && !label.textContent.includes('*')) {
                label.innerHTML += ' <span class="required-indicator" aria-label="required">*</span>';
            }
        });

        // Enhance error announcements
        const formInputs = document.querySelectorAll('.form-input');
        formInputs.forEach(input => {
            input.addEventListener('invalid', () => {
                setTimeout(() => {
                    const errorElement = document.getElementById(`${input.id}-error`);
                    if (errorElement && errorElement.textContent) {
                        this.announceToScreenReader(`Error: ${errorElement.textContent}`);
                    }
                }, 100);
            });
        });
    }
}

// ===== INITIALIZATION =====
class App {
    constructor() {
        this.components = [];
        this.init();
    }

    async init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
            });
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            // Initialize core components
            this.components.push(new ThemeManager());
            this.components.push(new NavigationManager());
            this.components.push(new BookingManager());
            this.components.push(new ContactManager());
            this.components.push(new GalleryManager());
            this.components.push(new FAQManager());
            this.components.push(new ServiceAnimations());
            this.components.push(new ScrollAnimations());
            this.components.push(new AccessibilityManager());
            
            // Initialize performance monitoring in production
            if (window.location.hostname !== 'localhost') {
                this.components.push(new PerformanceMonitor());
            }

            console.log('Cut & Crown Barber website initialized successfully');
            
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    destroy() {
        // Cleanup method for SPA transitions or testing
        this.components.forEach(component => {
            if (component.destroy && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = [];
    }
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    
    // In production, you might want to send this to an error reporting service
    if (window.location.hostname !== 'localhost') {
        // Example: Send to error reporting service
        // errorReportingService.report(event.error);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Prevent the error from showing in console for production
    if (window.location.hostname !== 'localhost') {
        event.preventDefault();
    }
});

// ===== START APPLICATION =====
const cutCrownApp = new App();

// Make app available globally for debugging
window.cutCrownApp = cutCrownApp;

// ===== SERVICE WORKER REGISTRATION (for PWA features) =====
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
