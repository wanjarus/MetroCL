var Cube = {
    init: function( options, elem ) {
        this.options = $.extend( {}, this.options, options );
        this.elem  = elem;
        this.element = $(elem);
        this.id = null;
        this.rules = null;
        this.interval = false;
        this.running = false;
        this.intervals = [];

        this._setOptionsFromDOM();
        this._create();

        return this;
    },

    default_rules: [
        {
            on: {'top': [16],      'left': [4],         'right': [1]},
            off: {'top': [13, 4],   'left': [1, 16],     'right': [13, 4]}
        },
        {
            on: {'top': [12, 15],  'left': [3, 8],      'right': [2, 5]},
            off: {'top': [9, 6, 3], 'left': [5, 10, 15], 'right': [14, 11, 8]}
        },
        {
            on: {'top': [11],      'left': [7],         'right': [6]},
            off: {'top': [1, 2, 5], 'left': [9, 13, 14], 'right': [15, 12, 16]}
        },
        {
            on: {'top': [8, 14],   'left': [2, 12],     'right': [9, 3]},
            off: {'top': [16],      'left': [4],         'right': [1]}
        },
        {
            on: {'top': [10, 7],   'left': [6, 11],     'right': [10, 7]},
            off: {'top': [12, 15],  'left': [3, 8],      'right': [2, 5]}
        },
        {
            on: {'top': [13, 4],   'left': [1, 16],     'right': [13, 4]},
            off: {'top': [11],      'left': [7],         'right': [6]}
        },
        {
            on: {'top': [9, 6, 3], 'left': [5, 10, 15], 'right': [14, 11, 8]},
            off: {'top': [8, 14],   'left': [2, 12],     'right': [9, 3]}
        },
        {
            on: {'top': [1, 2, 5], 'left': [9, 13, 14], 'right': [15, 12, 16]},
            off: {'top': [10, 7],   'left': [6, 11],     'right': [10, 7]}
        }
    ],

    options: {
        rules: null,
        color: null,
        flashColor: null,
        flashInterval: 1000,
        numbers: false,
        offBefore: true,
        attenuation: .3,
        stopOnBlur: false,
        cells: 4,
        margin: 8,
        showAxis: false,
        axisStyle: "arrow", //line
        cellClick: false,

        clsCube: "",
        clsCell: "",
        clsSide: "",
        clsSideLeft: "",
        clsSideRight: "",
        clsSideTop: "",
        clsSideLeftCell: "",
        clsSideRightCell: "",
        clsSideTopCell: "",
        clsAxis: "",
        clsAxisX: "",
        clsAxisY: "",
        clsAxisZ: "",

        custom: Metro.noop,
        onTick: Metro.noop,
        onCubeCreate: Metro.noop
    },

    _setOptionsFromDOM: function(){
        var that = this, element = this.element, o = this.options;

        $.each(element.data(), function(key, value){
            if (key in o) {
                try {
                    o[key] = JSON.parse(value);
                } catch (e) {
                    o[key] = value;
                }
            }
        });
    },

    _create: function(){
        var that = this, element = this.element, o = this.options;

        if (o.rules === null) {
            this.rules = this.default_rules;
        } else {
            this._parseRules(o.rules);
        }

        this._createCube();
        this._createEvents();

        Utils.exec(o.onCubeCreate, [element]);
    },

    _parseRules: function(rules){

        if (rules === undefined || rules === null) {
            return false;
        }

        if (Utils.isObject(rules)) {
            this.rules = Utils.isObject(rules);
            return true;
        } else {
            try {
                this.rules = JSON.parse(rules);
                return true;
            } catch (err) {
                console.log("Unknown or empty rules for cell flashing!");
                return false;
            }
        }
    },

    _createCube: function(){
        var that = this, element = this.element, o = this.options;
        var sides = ['left', 'right', 'top'];
        var id = "cube-"+(new Date()).getTime();
        var cells_count = Math.pow(o.cells, 2);

        element.addClass("cube").addClass(o.clsCube);

        if (element.attr('id') === undefined) {
            element.attr('id', id);
        }

        this.id = element.attr('id');

        this._createCssForFlashColor();
        this._createCssForCellSize();

        $.each(sides, function(){
            var side, cell, i;

            side = $("<div>").addClass("side " + this+"-side").addClass(o.clsSide).appendTo(element);

            if (this === 'left') {side.addClass(o.clsSideLeft);}
            if (this === 'right') {side.addClass(o.clsSideRight);}
            if (this === 'top') {side.addClass(o.clsSideTop);}

            for(i = 0; i < cells_count; i++) {
                cell = $("<div>").addClass("cube-cell").addClass("cell-id-"+(i+1)).addClass(o.clsCell);
                cell.data("id", i + 1).data("side", this);
                cell.appendTo(side);
                if (o.numbers === true) {
                    cell.html(i + 1);
                }
            }
        });

        var cells  = element.find(".cube-cell");
        if (o.color !== null) {
            if (Utils.isColor(o.color)) {
                cells.css({
                    backgroundColor: o.color,
                    borderColor: o.color
                })
            } else {
                cells.addClass(o.color);
            }
        }

        var axis = ['x', 'y', 'z'];
        $.each(axis, function(){
            var axis_name = this;
            var ax = $("<div>").addClass("axis " + o.axisStyle).addClass("axis-"+axis_name).addClass(o.clsAxis);
            if (axis_name === "x") ax.addClass(o.clsAxisX);
            if (axis_name === "y") ax.addClass(o.clsAxisY);
            if (axis_name === "z") ax.addClass(o.clsAxisZ);
            ax.appendTo(element);
        });

        if (o.showAxis === false) {
            element.find(".axis").hide();
        }

        this._run();
    },

    _run: function(){
        var that = this, element = this.element, o = this.options;
        var interval = 0;

        clearInterval(this.interval);
        element.find(".cube-cell").removeClass("light");

        if (o.custom !== Metro.noop) {
            Utils.exec(o.custom, [element]);
        } else {

            element.find(".cube-cell").removeClass("light");

            that._start();

            interval = Utils.isObject(this.rules) ? Utils.objectLength(this.rules) : 0;

            this.interval = setInterval(function(){
                that._start();
            }, interval * o.flashInterval);
        }
    },

    _createCssForCellSize: function(){
        var that = this, element = this.element, o = this.options;
        var sheet = Metro.sheet;
        var width;
        var cell_size;

        if (o.margin === 8 && o.cells === 4) {
            return ;
        }

        width = parseInt(Utils.getStyleOne(element, 'width'));
        cell_size = Math.ceil((width / 2 - o.margin * o.cells * 2) / o.cells);
        Utils.addCssRule(sheet, "#"+element.attr('id')+" .side .cube-cell", "width: "+cell_size+"px!important; height: "+cell_size+"px!important; margin: " + o.margin + "px!important;");
    },

    _createCssForFlashColor: function(){
        var that = this, element = this.element, o = this.options;
        var sheet = Metro.sheet;
        var rule1;
        var rule2;
        var rules1 = [];
        var rules2 = [];
        var i;

        if (o.flashColor === null) {
            return ;
        }

        rule1 = "0 0 10px " + Utils.hexColorToRgbA(o.flashColor, 1);
        rule2 = "0 0 10px " + Utils.hexColorToRgbA(o.flashColor, o.attenuation);

        for(i = 0; i < 3; i++) {
            rules1.push(rule1);
            rules2.push(rule2);
        }

        Utils.addCssRule(sheet, "@keyframes pulsar-cell-"+element.attr('id'), "0%, 100% { " + "box-shadow: " + rules1.join(",") + "} 50% { " + "box-shadow: " + rules2.join(",") + " }");
        Utils.addCssRule(sheet, "#"+element.attr('id')+" .side .cube-cell.light", "animation: pulsar-cell-" + element.attr('id') + " 2.5s 0s ease-out infinite; " + "background-color: " + o.flashColor + "!important; border-color: " + o.flashColor+"!important;");
    },

    _createEvents: function(){
        var that = this, element = this.element, o = this.options;

        $(window).on(Metro.events.blur, function(){
            if (o.stopOnBlur === true && that.running === true) {
                that._stop();
            }
        });

        $(window).on(Metro.events.focus, function(){
            if (o.stopOnBlur === true && that.running === false) {
                that._start();
            }
        });

        element.on(Metro.events.click, ".cube-cell", function(){
            if (o.cellClick === true) {
                var cell = $(this);
                cell.toggleClass("light");
            }
        });
    },

    _start: function(){
        var that = this, element = this.element, o = this.options;
        var sides = ['left', 'right', 'top'];

        element.find(".cube-cell").removeClass("light");

        this.running = true;

        $.each(this.rules, function(index, rule){

            that._tick(index);

            $.each(sides, function(){
                var side_class = "."+this+"-side";
                var side_name = this;
                var cells_on = rule["on"] !== undefined && rule["on"][side_name] !== undefined ? rule["on"][side_name] : false;
                var cells_off = rule["off"] !== undefined && rule["off"][side_name] !== undefined ? rule["off"][side_name] : false;

                if (cells_on !== false) $.each(cells_on, function(){
                    var cell_index = this;
                    var cell = element.find(side_class + " .cell-id-"+cell_index);

                    that._toggle(cell, 'on', index);
                });

                if (cells_off !== false) $.each(cells_off, function(){
                    var cell_index = this;
                    var cell = element.find(side_class + " .cell-id-"+cell_index);

                    that._toggle(cell, 'off', index);
                });
            });
        });
    },

    _stop: function(){
        this.running = false;
        clearInterval(this.interval);
    },

    _tick: function(index){
        var that = this, element = this.element, o = this.options;

        setTimeout(function(){
            Utils.exec(o.onTick, [index, element]);
        }, o.flashInterval * index);
    },

    _toggle: function(cell, func, time){
        var that = this;
        var interval = setTimeout(function(){
            cell[func === 'on' ? 'addClass' : 'removeClass']("light");
        }, this.options.flashInterval * time);
    },

    start: function(){
        this._start();
    },

    stop: function(){
        this._stop();
    },

    rule: function(r){
        if (r === undefined) {
            return this.rules;
        }

        if (this._parseRules(r) !== true) {
            return ;
        }
        this.options.rules = r;
        this._run();
    },

    axis: function(show){
        var func = show === true ? "show" : "hide";
        this.element.find(".axis")[func]();
    },

    changeRules: function(){
        var that = this, element = this.element, o = this.options;
        var rules = element.attr("data-rules");
        if (this._parseRules(rules) !== true) {
            return ;
        }
        o.rules = rules;
        this._run();
    },

    changeAxisVisibility: function(){
        var that = this, element = this.element, o = this.options;
        var visibility = JSON.parse(element.attr("data-show-axis")) === true;
        var func = visibility ? "show" : "hide";
        element.find(".axis")[func]();
    },

    changeAxisStyle: function(){
        var that = this, element = this.element, o = this.options;
        var style = element.attr("data-axis-style");

        element.find(".axis").removeClass("arrow line no-style").addClass(style);
    },

    changeAttribute: function(attributeName){
        switch (attributeName) {
            case "data-rules": this.changeRules(); break;
            case "data-show-axis": this.changeAxisVisibility(); break;
            case "data-axis-style": this.changeAxisStyle(); break;
        }
    }
};

Metro.plugin('cube', Cube);