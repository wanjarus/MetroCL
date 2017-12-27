var Calendar = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);
        this.today = new Date();
        this.today.setHours(0,0,0,0);
        this.show = new Date();
        this.show.setHours(0,0,0,0);
        this.current = {
            year: this.show.getFullYear(),
            month: this.show.getMonth(),
            day: this.show.getDate()
        };
        this.preset = [];
        this.selected = [];
        this.exclude = [];
        this.min = null;
        this.max = null;
        this.locale = null;
        this.minYear = this.current.year - this.options.yearsBefore;
        this.maxYear = this.current.year + this.options.yearsAfter;

        this._setOptionsFromDOM();
        this._create();

        return this;
    },

    options: {
        pickerMode: false,
        show: null,
        locale: METRO_LOCALE,
        weekStart: 0,
        outside: true,
        buttons: 'cancel, today, clear, done',
        yearsBefore: 100,
        yearsAfter: 100,
        clsCalendar: "",
        clsCalendarHeader: "",
        clsCalendarContent: "",
        clsCalendarFooter: "",
        clsCalendarMonths: "",
        clsCalendarYears: "",
        clsToday: "",
        clsSelected: "",
        clsExcluded: "",
        clsCancelButton: "",
        clsTodayButton: "",
        clsClearButton: "",
        clsDoneButton: "",
        isDialog: false,
        ripple: false,
        rippleColor: "#cccccc",
        exclude: null,
        preset: null,
        minDate: null,
        maxDate: null,
        weekDayClick: false,
        multiSelect: false,
        onCancel: Metro.noop,
        onToday: Metro.noop,
        onClear: Metro.noop,
        onDone: Metro.noop,
        onDayClick: Metro.noop,
        onWeekDayClick: Metro.noop,
        onMonthChange: Metro.noop,
        onYearChange: Metro.noop,
        onCalendarCreate: Metro.noop
    },

    _setOptionsFromDOM: function(){
        var element = this.element, o = this.options;

        $.each(element.data(), function(key, value){
            if (key in o) {
                try {
                    o[key] = $.parseJSON(value);
                } catch (e) {
                    o[key] = value;
                }
            }
        });
    },

    _create: function(){
        var that = this, element = this.element, o = this.options;

        element.html("").addClass("calendar").addClass(o.clsCalendar);

        if (o.preset !== null) {
            if (Array.isArray(o.preset) === false) {
                o.preset = o.preset.split(",").map(function(item){
                    return item.trim();
                });
            }

            $.each(o.preset, function(){
                if (Utils.isDate(this) === false) {
                    return ;
                }
                that.selected.push((new Date(this)).getTime());
            });
        }

        if (o.exclude !== null) {
            if (Array.isArray(o.exclude) === false) {
                o.exclude = o.exclude.split(",").map(function(item){
                    return item.trim();
                });
            }

            $.each(o.exclude, function(){
                if (Utils.isDate(this) === false) {
                    return ;
                }
                that.exclude.push((new Date(this)).getTime());
            });
        }

        if (o.buttons !== false) {
            if (Array.isArray(o.buttons) === false) {
                o.buttons = o.buttons.split(",").map(function(item){
                    return item.trim();
                });
            }
        }

        if (o.minDate !== null && Utils.isDate(o.minDate)) {
            this.min = new Date(o.minDate);
            this.min.setHours(0,0,0,0);
        }

        if (o.maxDate !== null && Utils.isDate(o.maxDate)) {
            this.max = new Date(o.maxDate);
            this.max.setHours(0,0,0,0);
        }

        if (o.show !== null && Utils.isDate(o.show)) {
            this.show = new Date(o.show);
            this.show.setHours(0,0,0,0);
            this.current = {
                year: this.show.getFullYear(),
                month: this.show.getMonth(),
                day: this.show.getDate()
            }
        }

        this.locale = Metro.locales[o.locale] !== undefined ? Metro.locales[o.locale] : Metro.locales["en-US"];

        this._build();
    },

    _build: function(){

        this._drawCalendar();
        this._bindEvents();

        if (this.options.ripple === true) {
            element.ripple({
                rippleTarget: ".button, .prev-month, .next-month, .prev-year, .next-year, .day",
                rippleColor: this.options.rippleColor
            });
        }


        Utils.exec(this.options.onCalendarCreate, [this.element]);
    },

    _bindEvents: function(){
        var that = this, element = this.element, o = this.options;

        element.on(Metro.events.click, ".prev-month, .next-month, .prev-year, .next-year", function(e){
            var new_date, el = $(this);

            if (el.hasClass("prev-month")) {
                new_date = new Date(that.current.year, that.current.month - 1, 1);
                if (new_date.getFullYear() < that.minYear) {
                    return ;
                }
            }
            if (el.hasClass("next-month")) {
                new_date = new Date(that.current.year, that.current.month + 1, 1);
                if (new_date.getFullYear() > that.maxYear) {
                    return ;
                }
            }
            if (el.hasClass("prev-year")) {
                new_date = new Date(that.current.year - 1, that.current.month, 1);
                if (new_date.getFullYear() < that.minYear) {
                    return ;
                }
            }
            if (el.hasClass("next-year")) {
                new_date = new Date(that.current.year + 1, that.current.month, 1);
                if (new_date.getFullYear() > that.maxYear) {
                    return ;
                }
            }

            that.current = {
                year: new_date.getFullYear(),
                month: new_date.getMonth(),
                day: new_date.getDate()
            };
            setTimeout(function(){
                that._drawContent();
                if (el.hasClass("prev-month") || el.hasClass("next-month")) {
                    Utils.exec(o.onMonthChange, [that.current, element]);
                }
                if (el.hasClass("prev-year") || el.hasClass("next-year")) {
                    Utils.exec(o.onYearChange, [that.current, element]);
                }
            }, o.ripple ? 300 : 0);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".button.today", function(e){
            that.today = new Date();
            that.current = {
                year: that.today.getFullYear(),
                month: that.today.getMonth(),
                day: that.today.getDate()
            };
            that._drawHeader();
            that._drawContent();
            Utils.exec(o.onToday, [that.today, element]);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".button.clear", function(e){
            that.selected = [];
            that._drawContent();
            Utils.exec(o.onClear, [element]);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".button.cancel", function(e){
            that._drawContent();
            Utils.exec(o.onCancel, [element]);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".button.done", function(e){
            that._drawContent();
            Utils.exec(o.onDone, [that.selected, element]);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".week-days .day", function(e){
            if (o.weekDayClick === false || o.multiSelect === false) {
                return ;
            }
            var day = $(this);
            var index = day.index();
            var days = o.outside === true ? element.find(".days-row .day:nth-child("+(index + 1)+")") : element.find(".days-row .day:not(.outside):nth-child("+(index + 1)+")");
            $.each(days, function(){
                var d = $(this);
                var dd = d.data('day');
                Utils.arrayDelete(that.selected, dd);
                that.selected.push(dd);
                d.addClass("selected").addClass(o.clsSelected);
            });
            Utils.exec(o.onWeekDayClick, [that.selected, day, element]);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".days-row .day", function(e){
            var day = $(this);
            var index, date;

            date = day.data('day');
            index = that.selected.indexOf(date);

            if (day.hasClass("outside")) {
                date = new Date(date);
                that.current = {
                    year: date.getFullYear(),
                    month: date.getMonth(),
                    day: date.getDate()
                };
                that._drawContent();
                return ;
            }

            if (o.pickerMode === true) {
                that.selected = [date];
                that.today = new Date(date);
                that.current.year = that.today.getFullYear();
                that.current.month = that.today.getMonth();
                that.current.day = that.today.getDate();
                that._drawHeader();
                that._drawContent();
            } else {
                if (index === -1) {
                    if (o.multiSelect === false) {
                        element.find(".days-row .day").removeClass("selected").removeClass(o.clsSelected);
                        that.selected = [];
                    }
                    that.selected.push(date);
                    day.addClass("selected").addClass(o.clsSelected);
                } else {
                    day.removeClass("selected").removeClass(o.clsSelected);
                    Utils.arrayDelete(that.selected, date);
                }
            }

            Utils.exec(o.onDayClick, [that.selected, day, element]);

            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".curr-month", function(e){
            element.find(".calendar-months").addClass("open");
            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".calendar-months li", function(e){
            that.current.month = $(this).index();
            that._drawContent();
            Utils.exec(o.onMonthChange, [that.current, element]);
            element.find(".calendar-months").removeClass("open");
            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".curr-year", function(e){
            element.find(".calendar-years").addClass("open");
            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, ".calendar-years li", function(e){
            that.current.year = $(this).text();
            that._drawContent();
            Utils.exec(o.onYearChange, [that.current, element]);
            element.find(".calendar-years").removeClass("open");
            e.preventDefault();
            e.stopPropagation();
        });

        element.on(Metro.events.click, function(e){
            var months = element.find(".calendar-months");
            var years = element.find(".calendar-years");
            if (months.hasClass("open")) {
                months.removeClass("open");
            }
            if (years.hasClass("open")) {
                years.removeClass("open");
            }
            e.preventDefault();
            e.stopPropagation();
        });
    },

    _drawHeader: function(){
        var element = this.element, o = this.options;
        var calendar_locale = this.locale['calendar'];
        var header = element.find(".calendar-header");

        if (header.length === 0) {
            header = $("<div>").addClass("calendar-header").addClass(o.clsCalendarHeader).appendTo(element);
        }

        header.html("");

        $("<div>").addClass("header-year").html(this.today.getFullYear()).appendTo(header);
        $("<div>").addClass("header-day").html(calendar_locale['days'][this.today.getDay()] + ", " + calendar_locale['months'][this.today.getMonth() + 12] + " " + this.today.getDate()).appendTo(header);
    },

    _drawFooter: function(){
        var element = this.element, o = this.options;
        var buttons_locale = this.locale['buttons'];
        var footer = element.find(".calendar-footer");

        if (o.buttons === false) {
            return ;
        }

        if (footer.length === 0) {
            footer = $("<div>").addClass("calendar-footer").addClass(o.clsCalendarFooter).appendTo(element);
        }

        footer.html("");

        $.each(o.buttons, function(){
            var button = $("<button>").addClass("button " + this + " " + o['cls'+this.capitalize()+'Button']).html(buttons_locale[this]).appendTo(footer);
            if (this === 'cancel' || this === 'done') {
                button.addClass("js-dialog-close");
            }
        });
    },

    _drawMonths: function(){
        var element = this.element, o = this.options;
        var months = $("<div>").addClass("calendar-months").addClass(o.clsCalendarMonths).appendTo(element);
        var list = $("<ul>").addClass("months-list").appendTo(months);
        var calendar_locale = this.locale['calendar'];
        var i;
        for(i = 0; i < 12; i++) {
            $("<li>").html(calendar_locale['months'][i]).appendTo(list);
        }
    },

    _drawYears: function(){
        var element = this.element, o = this.options;
        var years = $("<div>").addClass("calendar-years").addClass(o.clsCalendarYears).appendTo(element);
        var list = $("<ul>").addClass("years-list").appendTo(years);
        var i;
        for(i = this.minYear; i <= this.maxYear; i++) {
            $("<li>").html(i).appendTo(list);
        }
    },

    _drawContent: function(){
        var element = this.element, o = this.options;
        var content = element.find(".calendar-content"), toolbar;
        var calendar_locale = this.locale['calendar'];
        var i, j, d, s, counter = 0;
        var first = new Date(this.current.year, this.current.month, 1);
        var first_day;
        var prev_month_days = (new Date(this.current.year, this.current.month, 0)).getDate();
        var year, month;

        if (content.length === 0) {
            content = $("<div>").addClass("calendar-content").addClass(o.clsCalendarContent).appendTo(element);
        }
        content.html("");

        toolbar = $("<div>").addClass("calendar-toolbar").appendTo(content);

        /**
         * Calendar toolbar
         */
        $("<span>").addClass("prev-month").appendTo(toolbar);
        $("<span>").addClass("curr-month").html(calendar_locale['months'][this.current.month]).appendTo(toolbar);
        $("<span>").addClass("next-month").appendTo(toolbar);

        $("<span>").addClass("prev-year").appendTo(toolbar);
        $("<span>").addClass("curr-year").html(this.current.year).appendTo(toolbar);
        $("<span>").addClass("next-year").appendTo(toolbar);

        /**
         * Week days
         */
        var week_days = $("<div>").addClass("week-days").appendTo(content);
        for (i = 0; i < 7; i++) {
            if (o.weekStart === 0) {
                j = i;
            } else {
                j = i + 1;
                if (j === 7) j = 0;
            }
            $("<span>").addClass("day").html(calendar_locale["days"][j + 7]).appendTo(week_days);
        }

        /**
         * Calendar days
         */
        var days = $("<div>").addClass("days").appendTo(content);
        var days_row = $("<div>").addClass("days-row").appendTo(days);

        first_day = o.weekStart === 0 ? first.getDay() : (first.getDay() === 0 ? 6 : first.getDay() - 1);

        if (this.current.month - 1 < 0) {
            month = 11;
            year = this.current.year - 1;
        } else {
            month = this.current.month - 1;
            year = this.current.year;
        }

        for(i = 0; i < first_day; i++) {
            var v = prev_month_days - first_day + i + 1;
            d = $("<div>").addClass("day outside").appendTo(days_row);

            s = new Date(year, month, v);
            s.setHours(0,0,0,0);

            d.data('day', s.getTime());

            if (o.outside === true) {
                d.html(v);
                if (this.selected.indexOf(s.getTime()) !== -1) {
                    d.addClass("selected").addClass(o.clsSelected);
                }
                if (this.exclude.indexOf(s.getTime()) !== -1) {
                    d.addClass("disabled excluded").addClass(o.clsExcluded);
                }
                if (this.min !== null && s.getTime() < this.min.getTime()) {
                    d.addClass("disabled excluded").addClass(o.clsExcluded);
                }
                if (this.max !== null && s.getTime() > this.max.getTime()) {
                    d.addClass("disabled excluded").addClass(o.clsExcluded);
                }
            }

            counter++;
        }

        first.setHours(0,0,0,0);
        while(first.getMonth() === this.current.month) {
            d = $("<div>").addClass("day").html(first.getDate()).appendTo(days_row);

            d.data('day', first.getTime());

            if (
                this.today.getFullYear() === first.getFullYear() &&
                this.today.getMonth() === first.getMonth() &&
                this.today.getDate() === first.getDate()
            ) {
                d.addClass("today").addClass(o.clsToday);
            }

            if (this.selected.indexOf(first.getTime()) !== -1) {
                d.addClass("selected").addClass(o.clsSelected);
            }
            if (this.exclude.indexOf(first.getTime()) !== -1) {
                d.addClass("disabled excluded").addClass(o.clsExcluded);
            }

            if (this.min !== null && first.getTime() < this.min.getTime()) {
                d.addClass("disabled excluded").addClass(o.clsExcluded);
            }
            if (this.max !== null && first.getTime() > this.max.getTime()) {
                d.addClass("disabled excluded").addClass(o.clsExcluded);
            }

            counter++;
            if (counter % 7 === 0) {
                days_row = $("<div>").addClass("days-row").appendTo(days);
            }
            first.setDate(first.getDate() + 1);
            first.setHours(0,0,0,0);
        }

        first_day = o.weekStart === 0 ? first.getDay() : (first.getDay() === 0 ? 6 : first.getDay() - 1);

        if (this.current.month + 1 > 11) {
            month = 0;
            year = this.current.year + 1;
        } else {
            month = this.current.month + 1;
            year = this.current.year;
        }

        if (first_day > 0) for(i = 0; i < 7 - first_day; i++) {
            d = $("<div>").addClass("day outside").appendTo(days_row);
            s = new Date(year, month, i + 1);
            s.setHours(0,0,0,0);
            d.data('day', s.getTime());
            if (o.outside === true) {
                d.html(i + 1);
                if (this.selected.indexOf(s.getTime()) !== -1) {
                    d.addClass("selected").addClass(o.clsSelected);
                }
                if (this.exclude.indexOf(s.getTime()) !== -1) {
                    d.addClass("disabled excluded").addClass(o.clsExcluded);
                }
                if (this.min !== null && s.getTime() < this.min.getTime()) {
                    d.addClass("disabled excluded").addClass(o.clsExcluded);
                }
                if (this.max !== null && s.getTime() > this.max.getTime()) {
                    d.addClass("disabled excluded").addClass(o.clsExcluded);
                }
            }
        }

        var day_height = element.find(".day:nth-child(1)").css('width');

        element.find(".days-row .day").css({
            height: day_height,
            lineHeight: day_height
        });
    },

    _drawCalendar: function(){
        this.element.html("");
        this._drawHeader();
        this._drawContent();
        this._drawFooter();
        this._drawMonths();
        this._drawYears();
    },

    getPreset: function(){
        return this.preset;
    },

    getSelected: function(){
        return this.selected;
    },

    getExcluded: function(){
        return this.exclude;
    },

    getToday: function(){
        return this.today;
    },

    getCurrent: function(){
        return this.current;
    },

    setExclude: function(exclude){
        var that = this, element = this.element, o = this.options;

        o.exclude = exclude !== undefined ? exclude : element.attr("data-exclude");

        if (o.exclude !== null) {
            if (Array.isArray(o.exclude) === false) {
                o.exclude = o.exclude.split(",").map(function(item){
                    return item.trim();
                });
            }

            $.each(o.exclude, function(){
                if (Utils.isDate(this) === false) {
                    return ;
                }
                that.exclude.push((new Date(this)).getTime());
            });
        }

        this._drawContent();
    },

    setPreset: function(preset){
        var that = this, element = this.element, o = this.options;

        o.preset = preset !== undefined ? preset : element.attr("data-preset");

        if (o.preset !== null) {

            that.selected = [];

            if (Array.isArray(o.preset) === false) {
                o.preset = o.preset.split(",").map(function(item){
                    return item.trim();
                });
            }

            $.each(o.preset, function(){
                if (Utils.isDate(this) === false) {
                    return ;
                }
                that.selected.push((new Date(this)).getTime());
            });
        }

        this._drawContent();
    },

    setShow: function(show){
        var that = this, element = this.element, o = this.options;

        o.show = show !== null ? show : element.attr("data-show");

        if (o.show !== null && Utils.isDate(o.show)) {
            this.show = new Date(o.show);
            this.show.setHours(0,0,0,0);
            this.current = {
                year: this.show.getFullYear(),
                month: this.show.getMonth(),
                day: this.show.getDate()
            }
        }

        this._drawContent();
    },

    setMinDate: function(date){
        var that = this, element = this.element, o = this.options;

        o.minDate = date !== null ? date : element.attr("data-min-date");

        this._drawContent();
    },

    setMaxDate: function(date){
        var that = this, element = this.element, o = this.options;

        o.maxDate = date !== null ? date : element.attr("data-max-date");

        this._drawContent();
    },

    setToday: function(val){
        if (Utils.isDate(val) === false) {
            return ;
        }
        this.today = new Date(val);
        this.today.setHours(0,0,0,0);
        this._drawHeader();
        this._drawContent();
    },

    setLocale: function(){
        var that = this, element = this.element, o = this.options;

        o.locale = element.attr("data-locale");
        this.locale = Metro.locales[o.locale] !== undefined ? Metro.locales[o.locale] : Metro.locales["en-US"];
        this._drawCalendar();
    },

    changeAttribute: function(attributeName){
        switch (attributeName) {
            case 'data-exclude': this.setExclude(); break;
            case 'data-preset': this.setPreset(); break;
            case 'data-show': this.setShow(); break;
            case 'data-min-date': this.setMinDate(); break;
            case 'data-max-date': this.setMaxDate(); break;
            case 'data-locale': this.setLocale(); break;
        }
    }
};

$(document).on(Metro.events.click, function(e){
    $('.calendar .calendar-years').each(function(){
        $(this).removeClass("open");
    });
    $('.calendar .calendar-months').each(function(){
        $(this).removeClass("open");
    });
});

Metro.plugin('calendar', Calendar);