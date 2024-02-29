
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const bo = urlParams.get('bo')
console.log(bo);

const url = "../GSK/box/" + bo + ".json";
// const url = "/box/" + bo + ".json";

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
            let pre = parseInt(results.start.ind)
            console.log(pre)

            let rsum = 0
            let summ = 0

            results.box.forEach(function (e) {
                raz = e.ind - pre
                pre = e.ind
                rsum = raz * e.id
                summ += rsum - e.sum

                console.log(e.date)
                console.log(rsum)
                console.log(summ)



                cartItemsList.insertAdjacentHTML('beforeend', "<tr><td>" + e.date + "</ ><td>" + e.ind + "</td><td>" + raz + "</td><td>" + e.sum + "</td></tr > ");
            });

            const qw = document.getElementById("qw")
            qw.insertAdjacentHTML('beforeend', summ.toFixed(2))

        }
    })
})
