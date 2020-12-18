//= require solidus_paypal_braintree/constants
//= require solidus_paypal_braintree/promise
//= require solidus_paypal_braintree/client
//= require solidus_paypal_braintree/hosted_form

$(function() {
  var $paymentForm = $("#new_payment"),
      $hostedFields = $("[data-braintree-hosted-fields]"),
      hostedFieldsInstance = null;

  function onError (err) {
    var msg = err.name + ": " + err.message;
    show_flash("error", msg);
  }

  function showForm(id) {
    $("#card_form" + id).show();
  }

  function hideForm(id) {
    $("#card_form" + id).hide();
  }

  function addFormHook(braintreeForm, errorCallback) {
    var shouldSubmit = false;

    function submit(payload) {
      shouldSubmit = true;

      $("#payment_method_nonce", braintreeForm.hostedFields).val(payload.nonce);
      $paymentForm.submit();
    }

    return function(hostedFields) {
      $paymentForm.on("submit", function(e) {
        if ($hostedFields.is(":visible") && !shouldSubmit) {
          e.preventDefault();

          var cardholderName = $paymentForm.find('#cardholder-name input').val();
          hostedFields.tokenize({
            cardholderName: cardholderName
          }, function(err, payload) {
            if (err) {
              errorCallback(err);
            } else {
              submit(payload);
            }
          });
        }
      });
    };
  }

  function initFields($container, id) {
    function setHostedFieldsInstance(instance) {
      hostedFieldsInstance = instance;
      return instance;
    }

    if (hostedFieldsInstance === null) {
      braintreeForm = new SolidusPaypalBraintree.createHostedForm(id);
      braintreeForm.initialize().
        then(setHostedFieldsInstance).
        then(addFormHook(braintreeForm, onError)).
        fail(onError);
    }
  }

  // exit early if we're not looking at the New Payment form, or if no
  // SolidusPaypalBraintree payment methods have been configured.
  if (!$paymentForm.length || !$hostedFields.length) { return; }

  $hostedFields.each(function() {
    var $this = $(this);
    var $radios = $paymentForm.find("[name=card]");
    var id = $this.data("payment-method-id");

    // If we have previous cards, init fields on change of radio button
    if ($radios.length) {
      $radios.on("change", function() {
        $(this).val() == 'new' ? showForm(id) : hideForm(id);
      });
    } else {
      // If we don't have previous cards, init fields immediately
      showForm(id);
    }
  });
});
