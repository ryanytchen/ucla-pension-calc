document.getElementById('startDateYear').addEventListener('input', function() {
    var yearInput = this.value;
    var startMonthContainer = document.getElementById('startMonthContainer');
    
    if (yearInput === '2013') {
        startMonthContainer.style.display = 'block';
    } else {
        startMonthContainer.style.display = 'none';
    }
});

document.getElementById('pensionForm').addEventListener('submit', function(event) {
    event.preventDefault();
    calculatePension();
});

document.getElementById('clearButton').addEventListener('click', function() {
    clearForm();
});

function calculatePension() {
    const currentAge = parseInt(document.getElementById('currentAge').value);
    const startDateYear = parseInt(document.getElementById('startDateYear').value);
    const hapc = parseFloat(document.getElementById('hapc').value);
    const startDateMonth = parseInt(document.getElementById('startMonth').value);

    const currentYear = new Date().getFullYear();
    let ageFactors;
    let startAge;
    let displayLumpSum = startDateYear < 2013 || (startDateYear === 2013 && startDateMonth < 7);

    if (displayLumpSum) {
        startAge = 50;
        ageFactors = {
            50: 0.0110,
            51: 0.0124,
            52: 0.0138,
            53: 0.0152,
            54: 0.0166,
            55: 0.0180,
            56: 0.0194,
            57: 0.0208,
            58: 0.0222,
            59: 0.0236,
            60: 0.0250
        };
    } else {
        startAge = 55;
        ageFactors = {
            55: 0.0110,
            56: 0.0124,
            57: 0.0138,
            58: 0.0152,
            59: 0.0166,
            60: 0.0180,
            61: 0.0194,
            62: 0.0208,
            63: 0.0222,
            64: 0.0236,
            65: 0.0250
        };
    }

    const results = [];

    for (let age = startAge; age <= 100; age++) {
        const ageFactor = age <= 65 ? ageFactors[age] || 0.0250 : 0.0250;
        const retirementYear = currentYear + (age - currentAge);
        const serviceYears = retirementYear - startDateYear;
        const benefitPercentage = serviceYears * ageFactor;
        const yearlyPension = benefitPercentage * hapc;

        if (yearlyPension <= hapc) {
            const monthlyPension = yearlyPension / 12;
            const lumpSum = displayLumpSum ? monthlyPension * 182.76 : null;

            results.push({
                retirementAge: age,
                retirementYear: retirementYear,
                monthlyPension: monthlyPension,
                yearlyPension: yearlyPension,
                lumpSum: lumpSum,
                serviceYears: serviceYears,
                benefitPercentage: benefitPercentage * 100
            });
        } else {
            break;
        }
    }

    displayResults(results, displayLumpSum);
    displayGraph(results);
}

function displayResults(results, displayLumpSum) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (results.length > 0) {
        const table = document.createElement('table');
        table.classList.add('data', 'table', 'table-bordered', 'table-striped');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headers = ['Retirement Age', 'Retirement Year', 'Monthly Pension ($)', 'Yearly Pension ($)', 'Service Years', 'Benefit Percentage (%)'];
        if (displayLumpSum) {
            headers.splice(4, 0, 'Lump Sum Cashout ($)');
        }

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        results.forEach(result => {
            const row = document.createElement('tr');

            const formattedResult = {
                retirementAge: result.retirementAge.toFixed(0),
                retirementYear: result.retirementYear,
                monthlyPension: result.monthlyPension.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
                yearlyPension: result.yearlyPension.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
                serviceYears: result.serviceYears.toFixed(0),
                benefitPercentage: result.benefitPercentage.toFixed(2) + '%'
            };

            if (displayLumpSum) {
                formattedResult.lumpSum = result.lumpSum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
            }

            // Order the values as per the new requirement
            const orderedValues = [
                formattedResult.retirementAge,
                formattedResult.retirementYear,
                formattedResult.monthlyPension,
                formattedResult.yearlyPension
            ];
            
            if (displayLumpSum) {
                orderedValues.push(formattedResult.lumpSum);
            }

            orderedValues.push(formattedResult.serviceYears, formattedResult.benefitPercentage);

            orderedValues.forEach(value => {
                const td = document.createElement('td');
                td.textContent = value;
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        resultsDiv.appendChild(table);
        document.getElementById('resultsHeader').classList.remove('d-none');
        resultsDiv.classList.remove('d-none');
        document.getElementById('pensionGraph').classList.remove('d-none');
    } else {
        resultsDiv.textContent = 'No results to display.';
    }
}

function displayGraph(results) {
    const retirementAges = results.map(result => result.retirementAge);
    const yearlyPensions = results.map(result => result.yearlyPension);

    const trace = {
        x: retirementAges,
        y: yearlyPensions,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Yearly Pension',
        text: results.map(result => `
            Retirement Age: ${result.retirementAge}<br>
            Retirement Year: ${result.retirementYear}<br>
            Monthly Pension: ${result.monthlyPension.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}<br>
            Yearly Pension: ${result.yearlyPension.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}<br>
            Service Years: ${result.serviceYears}<br>
            Benefit Percentage: ${result.benefitPercentage.toFixed(2)}%
        `),
        hoverinfo: 'text'
    };

    const layout = {
        title: 'UCLA Pension Based on Retirement Age',
        xaxis: { title: 'Retirement Age' },
        yaxis: { title: 'Pension Amount ($)' },
        hovermode: 'closest',
        dragmode: false // Disable dragging on the graph
    };

    const config = {
        displayModeBar: false, // Hide the mode bar
        responsive: true,
        scrollZoom: false, // Disable scroll to zoom
        doubleClick: false, // Disable double-click zoom
        showTips: false // Disable additional tips
    };

    Plotly.newPlot('pensionGraph', [trace], layout, config);
}

function clearForm() {
    document.getElementById('pensionForm').reset();
    document.getElementById('resultsHeader').classList.add('d-none');
    document.getElementById('results').classList.add('d-none');
    document.getElementById('pensionGraph').classList.add('d-none');
}
