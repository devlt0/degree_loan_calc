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
    return principal * (r * (1 + r)**n) / ((1 + r)**n - 1)

def get_color_for_ratio(ratio: float) -> str:
    """Return color based on the ratio of payment to income."""
    if ratio <= 15:
        return "background-color: green"
    elif ratio <= 33.333:
        return "background-color: yellow"
    elif ratio <= 50:
        return "background-color: orange"
    return "background-color: red"

def calculate_total_tuition(base_tuition: float, is_per_semester: bool,
                          semesters_per_year: int, yearly_increase: float,
                          num_yrs_college: int) -> float:
    """Calculate total tuition cost over 4 years with yearly increases."""
    total = 0
    yearly_tuition = base_tuition * (semesters_per_year if is_per_semester else 1)

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

    # Assuming standard deduction of $13,850 (2024)
    taxable_income = max(0, gross_salary - 13850)
    taxes = taxable_income * tax_rate

    # Rough estimate of FICA taxes (7.65%)
    fica = gross_salary * 0.0765

    annual_takehome = gross_salary - taxes - fica
    return annual_takehome / 12

def main():
    st.set_page_config( layout="wide")
    #st.title("Student Loan Repayment Calculator")
    st.write("Analyze your ability to repay student loans based on future career prospects")
    with st.sidebar:
        with st.form("loan_calculator"):
            col1, col2 = st.columns(2)

            with col1:
                current_tuition = st.number_input("Current Tuition Amount",
                                                min_value=0.0,
                                                value=10000.0,
                                                step=1000.0)

                tuition_period = st.selectbox("Tuition Period",
                                            ["Per Semester", "Per Year"])

                semesters_per_year = st.number_input("Semesters per Year",
                                                   min_value=1,
                                                   max_value=8,
                                                   value=2)

                number_yrs_college = st.number_input("Number of years for degree",
                                                    min_value=1,
                                                    max_value=100,
                                                    value=4
                                                    )

            with col2:
                tuition_hike = st.number_input("Average Annual Tuition Increase (%)",
                                             min_value=0.0,
                                             max_value=50.0,
                                             value=5.0)

                interest_rate = st.number_input("Average Interest Rate (%)",
                                              min_value=0.0,
                                              max_value=50.0,
                                              value=9.0)

                #profession = st.text_input("Expected Entry-Level Position",
                #                         "Software Engineer")

                expected_salary = st.number_input("Expected Annual Starting Salary ($)",
                                                min_value=0,
                                                value=50000)

                cost_of_living = st.number_input("Estimated Monthly Cost of Living ($)",
                                               min_value=0,
                                               value=2500)

            submitted = st.form_submit_button("Calculate")

    if submitted:
        # Calculate total tuition
        is_per_semester = tuition_period == "Per Semester"
        total_tuition = calculate_total_tuition(
            current_tuition,
            is_per_semester,
            semesters_per_year,
            tuition_hike/100,
            number_yrs_college
        )

        # Calculate monthly take-home pay
        monthly_takehome = estimate_takehome_pay(expected_salary)
        col1, col2 = st.columns(2)
        with col1:
            st.write("### Analysis Results")
            st.write(f"Total 4-year tuition cost: ${total_tuition:,.2f}")
            st.write(f"Estimated monthly take-home pay: ${monthly_takehome:,.2f}")

            # Calculate and display loan payments for different terms
            loan_terms = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
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
                    #"% of Take-Home": f"{payment_ratio*100:.1f}%",
                    #"Ratio": payment_ratio  # Added for styling
                })

            # Create DataFrame and style it
            df = pd.DataFrame(results)

            # Create a style function that returns a list of styles for each row
            def style_rows(row):
                return [get_color_for_ratio(row['% of Take-Home'])] * len(row)

            # Apply styling and display
            styled_df = df.style.apply(style_rows, axis=1)

            st.dataframe(styled_df)

        with col2:
            # Additional analysis
            lowest_payment = min([float(r["Monthly Payment"].replace("$", "").replace(",", ""))
                                for r in results])
            remaining_money = monthly_takehome - lowest_payment - cost_of_living

            st.write("### Financial Summary")
            st.write(f"Lowest monthly payment: ${lowest_payment:,.2f}")
            st.write(f"Monthly take-home pay: ${monthly_takehome:,.2f}")
            st.write(f"Estimated cost of living: ${cost_of_living:,.2f}")
            st.write(f"Remaining monthly income: ${remaining_money:,.2f}")

            if remaining_money < 0:
                st.error("Warning: Your estimated expenses exceed your take-home pay!")
            elif remaining_money < 500:
                st.warning("Caution: Your remaining monthly income is very low!")
            # potentially take out the spare 1k a month
            elif remaining_money < 1000:
                st.warning("Caution: Your remaining monthly income is low!")
            else:
                st.success("Your financial plan appears sustainable!")

if __name__ == "__main__":
    main()