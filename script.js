
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const bo = urlParams.get('bo')
console.log(bo);
/* I put your JSON into an external file, loaded from github */
const url = "../box/" + bo + ".json";

const nameBox = document.getElementById("box");
nameBox.insertAdjacentHTML('beforeend', bo)


$(document).ready(function () {
    $.ajax({
        url: url,
        dataType: 'json',
        error: function () {
            console.log('JSON FAILED for data');
        },
        success: function (results) {


            var cartItemsList = document.getElementById("contbox");
            let raz = 0
            let pre = 0
            results.box.forEach(function (e) {
                raz = e.ind - pre
                pre = e.ind


                cartItemsList.insertAdjacentHTML('beforeend', "<tr><td>" + e.date + "</td><td>" + e.ind + " (+" + raz + ") " + "</td><td>" + e.sum + "</td></tr>");
            });
        }
    })
})
