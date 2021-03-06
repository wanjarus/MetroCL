var Toast = {
    create: function(message, callback, timeout, cls){
        var toast = $("<div>").addClass("toast").html(message).appendTo($("body")).hide();
        var width = toast.outerWidth();
        timeout = timeout || METRO_TIMEOUT;

        toast.css({
            'left': '50%',
            'margin-left': -(width / 2)
        }).addClass(cls).fadeIn(METRO_ANIMATION_DURATION);

        setTimeout(function(){
            toast.fadeOut(METRO_ANIMATION_DURATION, function(){
                toast.remove();
                Utils.callback(callback);
            });
        }, timeout);
    }
};

Metro['toast'] = Toast;