/**
 * reCaptcha module
 *
 * @copyright Copyright (c) WHMCS Limited 2005-2018
 * @license http://www.whmcs.com/license/ WHMCS Eula
 */
(function(module) {
    if (!WHMCS.hasModule('recaptcha')) {
        WHMCS.loadModule('recaptcha', module);
    }
})(
    function () {

        this.register = function () {
            var postLoad = [];
            var recaptchaForms = jQuery(".btn-recaptcha").parents('form');
            recaptchaForms.each(function (i, el){
                if (typeof recaptchaSiteKey === 'undefined') {
                    console.log('Recaptcha site key not defined');
                    return;
                }
                var frm = jQuery(el);
                var btnRecaptcha = frm.find(".btn-recaptcha");
                var isInvisible = btnRecaptcha.hasClass('btn-recaptcha-invisible');

                // if no recaptcha element, make one
                var recaptchaContent = frm.find("#divDynamicRecaptcha .g-recaptcha");
                if (!recaptchaContent.length) {
                    frm.append('<div id="divDynamicRecaptcha" class="g-recaptcha"></div>');
                    recaptchaContent = frm.find("#divDynamicRecaptcha");
                }
                // propagate invisible recaptcha if necessary
                if (isInvisible) {
                    if (recaptchaContent.data('size') !== 'invisible') {
                        recaptchaContent.attr('data-size', 'invisible');
                    }
                } else {
                    recaptchaContent.hide()
                }

                // ensure site key is available to grecaptcha
                recaptchaContent.attr('data-sitekey', recaptchaSiteKey);


                // alter form to work around JS behavior on .submit() when there
                // there is an input with the name 'submit'
                var btnSubmit = frm.find("input[name='submit']");
                if (btnSubmit.length) {
                    var action = frm.prop('action');
                    frm.prop('action', action + '&submit=1');
                    btnSubmit.remove();
                }

                // make callback for grecaptcha to invoke after
                // injecting token & make it known via data-callback
                var funcName = 'recaptchaCallback' + i;
                window[funcName] = function () {
                    if (isInvisible) {
                        frm.submit();
                    } else {
                        btnRecaptcha.prop("disabled", false);
                        recaptchaContent.slideUp('fast', function () {
                            recaptchaContent.hide();
                            btnRecaptcha.slideDown();
                        });

                    }
                };
                recaptchaContent.attr('data-callback', funcName);

                // alter submit button to integrate invisible recaptcha
                // otherwise setup a callback to twiddle UI after grecaptcha
                // has inject DOM
                if (isInvisible) {
                    btnRecaptcha.on('click', function (event) {
                        event.preventDefault();
                        grecaptcha.execute();
                    });
                } else {
                    postLoad.push(function () {
                        btnRecaptcha.slideUp('fast', function () {
                            btnRecaptcha.hide();
                            btnRecaptcha.prop("disabled", true);
                            recaptchaContent.find(':first').addClass('center-block');
                            recaptchaContent.slideDown('fast', function() {
                                // just in case there's a delay in DOM; rare
                                recaptchaContent.find(':first').addClass('center-block');
                            });
                        });
                    });
                }
            });

            // fetch/invoke the grecaptcha lib
            if (recaptchaForms.length) {
                var gUrl = "https://www.google.com/recaptcha/api.js";
                jQuery.getScript(gUrl, function () {
                    for(var i = postLoad.length -1; i >= 0 ; i--){
                        postLoad[i]();
                    }
                });
            }
        };

        return this;
    });
