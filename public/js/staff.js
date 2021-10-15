

$(document).ready(function () {

    $('#userDropdown').click(function () {
        $('#logoutDropdown').fadeToggle('fast')
    })

    /*    //// CIRCULATION //////////////////////// */

    $('#checkout').click(function () {
        console.log("hi")
        $('#checkoutForm').show()
    })
    $('#checkin').click(function () {
        $('#checkinForm').hide()
    })

    // AJAX ERROR HANDLING FUNCTION
    function checkAjaxError(jqXHR, exception) {
        var msg = '';
        if (jqXHR.status === 0) {
            msg = 'Not connect.\n Verify Network.';
        } else if (jqXHR.status == 404) {
            msg = 'Requested page not found. [404]';
        } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
        } else if (exception === 'parsererror') {
            msg = 'Requested JSON parse failed.';
        } else if (exception === 'timeout') {
            msg = 'Time out error.';
        } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
        } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
        }
        console.log(msg)
    }
    /////     AJAX FOR DUPLICATE BARCODE ///////////
    $('#book-barcode-input').blur(function () {
        var typedBarcode = $('#book-barcode-input').val()
        $.ajax({
            url: '/staff/catalogue/check-duplicate-barcode',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ barcodeTyped: typedBarcode }),
            success: function (response) {
                if (response.barcodeError) {
                    $('#add-book-form').submit(function (e) {
                        e.preventDefault()
                    })
                    $('#duplicate_barcode').show()
                } else {
                    $('#duplicate_barcode').hide()
                }
            },
            error: function (jqXHR, exception) {
                checkAjaxError(jqXHR, exception)
            }
        })
    })

    $('#cardNum-input').blur(() => {
        var cardNum = $('#cardNum-input').val()
        $.ajax({
            url: '/staff/patrons/check-duplicate-patron',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ cardNumber: cardNum }),
            success: (data) => {
                if (data.isCardNumberDuplicate) {
                    $('#duplicate-patron').show()
                    $('#add-patron-form').submit((e) => {
                        e.preventDefault()
                    })
                } else {
                    $('#duplicate-patron').hide()
                }
            },
            error: (jqXHR, exception)=>{
                checkAjaxError(jqXHR, exception)
            }
        })
    })



})