var Datepicker = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);
        this.value = null;
        this.value_date = null;
        this.calendar = null;

        this._setOptionsFromDOM();
        this._create();

        Utils.exec(this.options.onDatepickerCreate, [this.element]);

        return this;
    },

    options: {
        format: "%Y/%m/%d",
        clearButton: false,
        calendarButtonIcon: "<sapn class='mif-calendar'></sapn>",
        clearButtonIcon: "<span class='mif-cross'></span>",
        copyInlineStyles: true,
        onDatepickerCreate: Metro.noop,
        onCalendarShow: Metro.noop,
        onCalendarHide: Metro.noop,
        onChange: Metro.noop,

        locale: METRO_LOCALE,
        weekStart: 0,
        outside: true,
        clsCalendar: "",
        clsCalendarHeader: "",
        clsCalendarContent: "",
        clsCalendarFooter: "",
        clsCalendarMonths: "",
        clsCalendarYears: "",
        clsToday: "",
        clsSelected: "",
        clsExcluded: "",
        ripple: false,
        rippleColor: "#cccccc",
        exclude: null,
        preset: null,
        minDate: null,
        maxDate: null,
        onDayClick: Metro.noop
    },

    _setOptionsFromDOM: function(){
        var that = this, element = this.element, o = this.options;

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
        var prev = element.prev();
        var parent = element.parent();
        var container = $("<div>").addClass("input " + element[0].className + " datepicker");
        var buttons = $("<div>").addClass("button-group");
        var calendarButton, clearButton, cal = $("<div>").addClass("drop-shadow");

        this.value = element.val();
        if (Utils.isDate(this.value)) {
            this.value_date = new Date(this.value);
            this.value_date.setHours(0,0,0,0);
            element.val(this.value_date.format(o.format));
        }

        if (prev.length === 0) {
            parent.prepend(container);
        } else {
            container.insertAfter(prev);
        }

        element.appendTo(container);
        buttons.appendTo(container);
        cal.appendTo(container);

        cal.calendar({
            pickerMode: true,
            show: o.value,
            locale: o.locale,
            weekStart: o.weekStart,
            outside: o.outside,
            buttons: false,
            clsCalendar: o.clsCalendar,
            clsCalendarHeader: o.clsCalendarHeader,
            clsCalendarContent: o.clsCalendarContent,
            clsCalendarFooter: o.clsCalendarFooter,
            clsCalendarMonths: o.clsCalendarMonths,
            clsCalendarYears: o.clsCalendarYears,
            clsToday: o.clsToday,
            clsSelected: o.clsSelected,
            clsExcluded: o.clsExcluded,
            ripple: o.ripple,
            rippleColor: o.rippleColor,
            exclude: o.exclude,
            minDate: o.minDate,
            maxDate: o.maxDate,
            onDayClick: function(sel, day, el){
                var date = new Date(sel[0]);
                that.value = date.format("%Y/%m/%d");
                that.value_date = date;
                element.val(date.format(o.format, o.locale));
                element.trigger("change");
                cal.removeClass("open");
            }
        });

        this.calendar = cal;

        calendarButton = $("<button>").addClass("button").attr("tabindex", -1).attr("type", "button").html(o.calendarButtonIcon);
        calendarButton.on("click", function(e){
            if (Utils.isDate(that.value) && cal.hasClass("open") === false) {
                cal.data('calendar').setPreset(that.value);
                cal.data('calendar').setShow(that.value);
                cal.data('calendar').setToday(that.value);
            }
            if (cal.hasClass("open") === false) {
                $(".datepicker .calendar").removeClass("open");
                cal.addClass("open");
                Utils.exec(o.onCalendarShow, [cal]);
            } else {
                cal.removeClass("open");
                Utils.exec(o.onCalendarHide, [cal]);
            }
            e.preventDefault();
            e.stopPropagation();
        });
        calendarButton.appendTo(buttons);

        if (o.clearButton === true) {
            clearButton = $("<button>").addClass("button").attr("tabindex", -1).attr("type", "button").html(o.clearButtonIcon);
            clearButton.on("click", function () {
                element.val("").trigger('change');
            });
            clearButton.appendTo(buttons);
        }

        if (element.attr('dir') === 'rtl' ) {
            container.addClass("rtl");
        }

        element[0].className = '';
        element.attr("readonly", true);

        if (o.copyInlineStyles === true) {
            $.each(Utils.getInlineStyles(element), function(key, value){
                container.css(key, value);
            });
        }

        element.on("blur", function(){container.removeClass("focused");});
        element.on("focus", function(){container.addClass("focused");});
        element.on("change", function(){
            Utils.exec(o.onChange, [that.value_date, that.value, element]);
        });
    },

    val: function(v){
        var that = this, element = this.element, o = this.options;

        if (v === undefined) {
            return this.value_date;
        }

        if (Utils.isDate(v) === true) {
            this.value_date = new Date(v);
            this.value = this.value_date.format(o.format);
            element.val(this.value_date.format(o.format));
            element.trigger("change");
        }
    },

    changeValue: function(){
        var that = this, element = this.element, o = this.options;
        this.val(element.attr("value"));
    },

    disable: function(){
        this.element.data("disabled", true);
        this.element.parent().addClass("disabled");
    },

    enable: function(){
        this.element.data("disabled", false);
        this.element.parent().removeClass("disabled");
    },

    toggleState: function(){
        if (this.element.data("disabled") === false) {
            this.disable();
        } else {
            this.enable();
        }
    },

    changeAttribute: function(attributeName){
        switch (attributeName) {
            case "value": this.changeValue(); break;
            case 'disabled': this.toggleState(); break;
        }
    }
};

Metro.plugin('datepicker', Datepicker);

$(document).on('click', function(e){
    console.log(e.target)
    $(".datepicker .calendar").removeClass("open");
});