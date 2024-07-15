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

    const lumpSumMultipliers = {
        50: 206.34,
        51: 206.34 + (200.77 - 206.34) * (51 - 50) / (52 - 50),
        52: 200.77,
        53: 201.11,
        54: 201.11 + (195.07 - 201.11) * (54 - 53) / (55 - 53),
        55: 195.07,
        56: 195.07 + (182.76 - 195.07) * (56 - 55) / (60 - 55),
        57: 195.07 + (182.76 - 195.07) * (57 - 55) / (60 - 55),
        58: 195.07 + (182.76 - 195.07) * (58 - 55) / (60 - 55),
        59: 195.07 + (182.76 - 195.07) * (59 - 55) / (60 - 55),
        60: 182.76,
        61: 182.76 + (172.12 - 182.76) * (61 - 60) / (63 - 60),
        62: 182.76 + (172.12 - 182.76) * (62 - 60) / (63 - 60),
        63: 172.12,
        64: 172.12 + (168.64 - 172.12) * (64 - 63) / (65 - 63),
        65: 165.04,
        70: 145.24,
        75: 122.85
    };

    // Linear interpolation for ages between known points
    function interpolateMultiplier(age, age1, multiplier1, age2, multiplier2) {
        return multiplier1 + (multiplier2 - multiplier1) * (age - age1) / (age2 - age1);
    }

    // Calculate multipliers for ages 66 to 69
    for (let age = 66; age < 70; age++) {
        lumpSumMultipliers[age] = interpolateMultiplier(age, 65, 165.04, 70, 145.24);
    }

    // Calculate multipliers for ages 71 to 74
    for (let age = 71; age < 75; age++) {
        lumpSumMultipliers[age] = interpolateMultiplier(age, 70, 145.24, 75, 122.85);
    }

    // Calculate multipliers for ages 76 to 100
    for (let age = 76; age <= 100; age++) {
        lumpSumMultipliers[age] = interpolateMultiplier(age, 75, 122.85, 100, 0);
    }

    const results = [];
    let previousMonthlyPension = null;
    let previousLumpSum = null;
    let previousBenefitPercentage = null;

    for (let age = startAge; age <= 100; age++) {
        const ageFactor = age <= 65 ? ageFactors[age] || 0.0250 : 0.0250;
        const retirementYear = currentYear + (age - currentAge);
        const serviceYears = retirementYear - startDateYear;
        const benefitPercentage = serviceYears * ageFactor;
        const yearlyPension = benefitPercentage * hapc;

        if (yearlyPension <= hapc) {
            const monthlyPension = yearlyPension / 12;
            const lumpSum = displayLumpSum ? monthlyPension * lumpSumMultipliers[age] : null;

            let monthlyPensionChange = null;
            let lumpSumChange = null;
            let benefitPercentageChange = null;

            if (previousMonthlyPension !== null) {
                monthlyPensionChange = ((monthlyPension - previousMonthlyPension) / previousMonthlyPension) * 100;
            }

            if (previousLumpSum !== null && lumpSum !== null) {
                lumpSumChange = ((lumpSum - previousLumpSum) / previousLumpSum) * 100;
            }

            if (previousBenefitPercentage !== null) {
                benefitPercentageChange = ((benefitPercentage - previousBenefitPercentage) / previousBenefitPercentage) * 100;
            }

            results.push({
                retirementAge: age,
                retirementYear: retirementYear,
                monthlyPension: monthlyPension,
                monthlyPensionChange: monthlyPensionChange,
                yearlyPension: yearlyPension,
                lumpSum: lumpSum,
                lumpSumChange: lumpSumChange,
                serviceYears: serviceYears,
                benefitPercentage: benefitPercentage * 100,
                benefitPercentageChange: benefitPercentageChange
            });

            previousMonthlyPension = monthlyPension;
            previousLumpSum = lumpSum;
            previousBenefitPercentage = benefitPercentage;
        } else {
            break;
        }
    }

    displayResults(results, displayLumpSum, lumpSumMultipliers, currentAge);
    displayGraph(results);
}

function displayResults(results, displayLumpSum, lumpSumMultipliers, currentAge) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    if (results.length > 0) {
        const table = document.createElement('table');
        table.classList.add('data', 'table', 'table-bordered', 'table-striped');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        const headers = ['Retirement Age', 'Retirement Year', 'Service Years', 'Monthly Pension ($)', 'Yearly Pension ($)', 'Benefit Percentage (%)'];
        if (displayLumpSum) {
            headers.splice(6, 0, 'Lump Sum Cashout ($)');
        }

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        results.forEach((result, index) => {
            if (result.retirementAge >= currentAge) { // Only show rows for ages >= currentAge
                const row = document.createElement('tr');

                const formattedResult = {
                    retirementAge: result.retirementAge.toFixed(0),
                    retirementYear: result.retirementYear,
                    serviceYears: result.serviceYears.toFixed(0),
                    monthlyPension: formatPension(result.monthlyPension, result.monthlyPensionChange),
                    yearlyPension: result.yearlyPension.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
                    benefitPercentage: formatPercentage(result.benefitPercentage, result.benefitPercentageChange)
                };

                if (displayLumpSum) {
                    formattedResult.lumpSum = formatPension(result.lumpSum, result.lumpSumChange, result.monthlyPension, lumpSumMultipliers[result.retirementAge], index);
                }

                const orderedValues = [
                    formattedResult.retirementAge,
                    formattedResult.retirementYear,
                    formattedResult.serviceYears,
                    formattedResult.monthlyPension,
                    formattedResult.yearlyPension,
                    formattedResult.benefitPercentage,
                    formattedResult.lumpSum
                    
                ];

                orderedValues.forEach(value => {
                    const td = document.createElement('td');
                    td.innerHTML = value;
                    row.appendChild(td);
                });

                tbody.appendChild(row);
            }
        });

        table.appendChild(tbody);
        resultsDiv.appendChild(table);
        document.getElementById('resultsHeader').classList.remove('d-none');
        resultsDiv.classList.remove('d-none');
        document.getElementById('pensionGraph').classList.remove('d-none');

        // Initialize Bootstrap popovers
        $('[data-toggle="popover"]').popover();
    } else {
        resultsDiv.textContent = 'No results to display.';
    }
}

function formatPension(value, change, monthlyPension = null, multiplier = null, index = null) {
    const formattedValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    const popoverContent = monthlyPension && multiplier ? `Calculation: ${monthlyPension.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })} x ${multiplier.toFixed(2)} = ${formattedValue}` : '';
    const popoverAttributes = monthlyPension && multiplier ? `data-toggle="popover" data-trigger="hover" data-content="${popoverContent}"` : '';
    if (change !== null) {
        const formattedChange = change.toFixed(2) + '%';
        const color = change > 0 ? 'green' : 'red';
        const direction = change > 0 ? '&#9650;' : '&#9660;';
        return `<span ${popoverAttributes}>${formattedValue} <span style="font-size: smaller; color: ${color};">${direction} ${formattedChange}</span></span>`;
    }
    return `<span ${popoverAttributes}>${formattedValue}</span>`;
}

function formatPercentage(value, change) {
    const formattedValue = value.toFixed(2) + '%';
    if (change !== null) {
        const formattedChange = change.toFixed(2) + '%';
        const color = change > 0 ? 'green' : 'red';
        const direction = change > 0 ? '&#9650;' : '&#9660;';
        return `${formattedValue} <span style="font-size: smaller; color: ${color};">${direction} ${formattedChange}</span>`;
    }
    return formattedValue;
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
            Benefit Percentage: ${result.benefitPercentage.toFixed(2)}%<br>
            Lump Sum Cashout: ${result.lumpSum ? result.lumpSum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) : 'N/A'}
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
