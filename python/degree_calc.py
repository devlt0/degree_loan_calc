import streamlit as st
import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import List


@dataclass
class LoanDetails:
    total_tuition: float
    interest_rate: float
    loan_terms: List[int]
    monthly_takehome: float

def calculate_monthly_payment(principal: float, annual_rate: float, years: int) -> float:
    """Calculate monthly payment for a loan using amortization formula."""
    r = annual_rate / 12  # Monthly interest rate
    n = years * 12        # Total number of payments
    if r == 0:
        return principal / n
    monthly_payment = principal * (r * (1 + r)**n) / ((1 + r)**n - 1)
    return monthly_payment

def get_color_for_ratio(ratio: float) -> str:
    """Return color based on the ratio of payment to income."""
    if ratio <= 15:
        return "background-color: green"
    elif ratio <= 33.333:
        return "background-color: yellow"
    elif ratio <= 50:
        return "background-color: orange"
    return "background-color: red"

def calculate_total_tuition(base_tuition: float,
                          semesters_per_year: int, yearly_increase: float,
                          num_yrs_college: int) -> float:
    """Calculate total tuition cost over 4 years with yearly increases."""
    total = 0
    yearly_tuition = base_tuition * semesters_per_year

    for year in range(num_yrs_college):  # Assuming 4-year degree
        total += yearly_tuition
        yearly_tuition *= (1 + yearly_increase)
    return total

def estimate_takehome_pay(gross_salary: float) -> float:
    """Estimate monthly take-home pay after federal taxes."""
    # Simplified tax calculation - 2024 tax brackets
    if gross_salary <= 11600:
        tax_rate = 0.10
    elif gross_salary <= 47150:
        tax_rate = 0.12
    elif gross_salary <= 100525:
        tax_rate = 0.22
    elif gross_salary <= 191950:
        tax_rate = 0.24
    else:
        tax_rate = 0.32

    std_deduction_2024 = 13850
    taxable_income = max(0, gross_salary - std_deduction_2024)
    taxes = taxable_income * tax_rate

    fica = gross_salary * 0.0765 # presume employee not contractor or self employeed / then x2
    # should have opt for std deduction to go up but this is estimator

    annual_takehome = gross_salary - taxes - fica
    return annual_takehome / 12

def main():
    st.set_page_config( layout="wide")
    #st.title("Student Loan Repayment Calculator")
    st.write("Analyze your ability to repay student loans based on future career prospects")
    with st.sidebar:
        #with st.form("loan_calculator"):
            col1, col2 = st.columns(2)

            with col1:
                current_tuition = st.number_input("Current Tuition Amount",
                                                min_value=0.0,
                                                value=10000.0,
                                                step=1000.0)

                tuition_period = st.selectbox("Tuition Period",
                                            ["Per Semester", "Per Year"])
                if tuition_period == "Per Semester":
                    semesters_per_year = st.number_input("Semesters per Year",
                                                       min_value=1,
                                                       max_value=8,
                                                       value=2,
                                                       step=1)
                else:
                    semesters_per_year = 1

                number_yrs_college = st.number_input("Number of years for degree",
                                                    min_value=1,
                                                    max_value=100,
                                                    value=4,
                                                    step=1
                                                    )

            with col2:
                tuition_hike = st.number_input("Average Annual Tuition Increase (%)",
                                             min_value=0.0,
                                             max_value=50.0,
                                             value=5.0,
                                             step=1.0)

                interest_rate = st.number_input("Average Interest Rate (%)",
                                              min_value=0.0,
                                              max_value=50.0,
                                              value=9.0,
                                              step=1.0)

                #profession = st.text_input("Expected Entry-Level Position",
                #                         "Software Engineer")

                expected_salary = st.number_input("Expected Annual Starting Salary ($)",
                                                min_value=0,
                                                value=50000,
                                                step = 1000)

                cost_of_living = st.number_input("Estimated Monthly Cost of Living ($)",
                                               min_value=0,
                                               value=2500,
                                               step=100)

            #submitted = st.form_submit_button("Calculate")
            submitted = st.button("Calculate")

    if submitted: #st.button("Calculate"):#submitted:
        total_tuition = calculate_total_tuition(
            current_tuition,
            semesters_per_year,
            tuition_hike/100,
            number_yrs_college
        )

        # Calculate monthly take-home pay
        monthly_takehome = estimate_takehome_pay(expected_salary)
        col1, col2 = st.columns(2)
        with col1:
            st.write("### Analysis Results")
            st.write(f"Estimated total {number_yrs_college}-year tuition cost: ${total_tuition:,.2f}")
            st.write(f"Estimated monthly take-home pay: ${monthly_takehome:,.2f}")

            # Calculate and display loan payments for different terms
            loan_terms = [5, 10, 15, 20, 25, 30]
            results = []

            for years in loan_terms:
                monthly_payment = calculate_monthly_payment(
                    total_tuition,
                    interest_rate/100,
                    years
                )
                payment_ratio = monthly_payment / monthly_takehome

                results.append({
                    "Term (Yrs)": years,
                    "Monthly Payment": f"${monthly_payment:,.2f}",
                    "% of Take-Home": payment_ratio*100,
                })

            df = pd.DataFrame(results)

            def style_rows(row):
                return [get_color_for_ratio(row['% of Take-Home'])] * len(row)

            styled_df = df.style.apply(style_rows, axis=1)
            st.dataframe(styled_df)
            st.write(f"Note: Table color coding is based on loan payment % of monthly takehome")
        with col2:
            # Additional analysis
            lowest_payment = min([float(r["Monthly Payment"].replace("$", "").replace(",", ""))
                                for r in results])
            remaining_money = monthly_takehome - lowest_payment - cost_of_living
            txt_clr = 'green'
            if remaining_money < 0:
                txt_clr = 'red'
            elif remaining_money < 400: # spare 100 a week to keep from paycheck to paychk
                txt_clr = 'orange'
            elif remaining_money < 750:
                txt_clr = 'blue' #'yellow' # yellow technically not supported thus the intermittent issues
            # Colored text, using the syntax :color[text to be colored],
            ## where color needs to be replaced with any of the following supported colors: blue, green, orange, red, violet

            st.write("### Financial Summary")
            st.write(f"Monthly take-home pay (after taxes + fica): ${monthly_takehome:,.2f}")
            st.write(f"Estimated cost of living: ${cost_of_living:,.2f}")
            st.write(f"Lowest monthly payment: ${lowest_payment:,.2f}")
            st.markdown(f":{txt_clr}[Remaining monthly income: ${remaining_money:,.2f}]")


            if remaining_money < 0:
                st.error("Warning: Your estimated expenses exceed your take-home pay!")
            elif remaining_money < 400: # spare 100 a week to keep from paycheck to paychk
                st.warning("Caution: Your remaining monthly income is very low! Less than $400/month.")
            # potentially take out the spare 1k a month --> reduce to 750 // 800 minus a minor incidental ~= 200/wk -50 oh shit happened
            elif remaining_money < 750:
                st.warning("Caution: Your remaining monthly income is low! Less than $750/month")
            else:
                st.success("Your financial plan appears sustainable! Minimum $750/month remaining.")

if __name__ == "__main__":
    main()