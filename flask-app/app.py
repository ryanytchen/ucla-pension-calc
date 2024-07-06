import numpy as np
import plotly.graph_objects as go
from datetime import datetime
import pandas as pd
from flask import Flask, render_template, request

app = Flask(__name__)

# Age factors for the UCRP 1976 Tier (pre-2013)
age_factors_pre_2013 = {
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
    60: 0.0250,
}

# Age factors for the UCRP 2013 Tier (ages 55-65)
age_factors_2013_on = {
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
    65: 0.0250,
}

def calculate_pension_curve(current_age, start_date_year, hapc):
    current_year = datetime.now().year
    if start_date_year < 2013:
        age_factors = age_factors_pre_2013
    else:
        age_factors = age_factors_2013_on
    
    retirement_ages = np.array(list(age_factors.keys()))
    monthly_pensions = []
    yearly_pensions = []
    service_years_list = []
    benefit_percentages = []
    retirement_years = []
    
    for age in retirement_ages:
        retirement_year = current_year + (age - current_age)
        service_years = retirement_year - start_date_year
        age_factor = age_factors[age]
        benefit_percentage = service_years * age_factor
        yearly_pension = benefit_percentage * hapc
        monthly_pension = yearly_pension / 12
        monthly_pensions.append(monthly_pension)
        yearly_pensions.append(yearly_pension)
        service_years_list.append(service_years)
        benefit_percentages.append(benefit_percentage * 100)  # Convert to percentage
        retirement_years.append(retirement_year)
    
    return retirement_ages, np.array(monthly_pensions), np.array(yearly_pensions), service_years_list, benefit_percentages, retirement_years

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        current_age = int(request.form['current_age'])
        start_date_year = int(request.form['start_date_year'])
        hapc = float(request.form['hapc'])

        # Calculate pension curve
        retirement_ages, monthly_pensions, yearly_pensions, service_years_list, benefit_percentages, retirement_years = calculate_pension_curve(current_age, start_date_year, hapc)

        # Create the DataFrame for tabular format
        data = {
            'Retirement Age': retirement_ages,
            'Retirement Year': retirement_years,
            'Service Years': service_years_list,
            'Benefit Percentage (%)': benefit_percentages,
            'Monthly Pension ($)': monthly_pensions,
            'Yearly Pension ($)': yearly_pensions
        }
        df = pd.DataFrame(data)
        df['Monthly Pension ($)'] = df['Monthly Pension ($)'].apply(lambda x: f"${x:,.2f}")
        df['Yearly Pension ($)'] = df['Yearly Pension ($)'].apply(lambda x: f"${x:,.2f}")

        # Create the interactive plot
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=retirement_ages, y=yearly_pensions, mode='lines+markers', name='Yearly Pension',
                                 hoverinfo='text', text=[f'Age: {age}<br>Retirement Year: {ry}<br>Service Years: {sy}<br>Benefit Percentage: {bp:.2f}%<br>Monthly: ${mp:,.2f}<br>Yearly: ${yp:,.2f}' for age, ry, sy, bp, mp, yp in zip(retirement_ages, retirement_years, service_years_list, benefit_percentages, monthly_pensions, yearly_pensions)]))
        fig.update_layout(
            title='UCLA Pension Based on Retirement Age',
            xaxis_title='Retirement Age',
            yaxis_title='Pension Amount ($)',
            hovermode='closest'
        )

        graph_html = fig.to_html(full_html=False)

        return render_template('index.html', tables=[df.to_html(classes='data', header=True, index=False)], graph_html=graph_html)
    
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
