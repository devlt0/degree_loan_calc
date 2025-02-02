
use yew::prelude::*;
use serde::{Deserialize, Serialize};
use web_sys::HtmlInputElement;


#[derive(Clone, PartialEq, Serialize, Deserialize)]
struct LoanDetails {
    total_tuition: f64,
    interest_rate: f64,
    loan_terms: Vec<i32>,
    monthly_takehome: f64,
}

#[derive(Clone, PartialEq)]
struct PaymentResult {
    term: i32,
    monthly_payment: f64,
    percent_of_takehome: f64,
}

#[derive(Clone, PartialEq, Default)]
struct FormData {
    current_tuition: f64,
    tuition_period: String,
    semesters_per_year: i32,
    number_yrs_college: i32,
    tuition_hike: f64,
    interest_rate: f64,
    expected_salary: f64,
    cost_of_living: f64,
}

enum Msg {
    UpdateField(String, String),
    Calculate,
}

struct LoanCalculator {
    form_data: FormData,
    results: Option<CalculationResults>,
}

struct CalculationResults {
    total_tuition: f64,
    monthly_takehome: f64,
    payments: Vec<PaymentResult>,
    lowest_payment: f64,
    remaining_money: f64,
}


impl Component for LoanCalculator {
    type Message = Msg;
    type Properties = ();

    fn create(_ctx: &Context<Self>) -> Self {
        Self {
            form_data: FormData {
                current_tuition: 10000.0,
                tuition_period: "Per Semester".to_string(),
                semesters_per_year: 2,
                number_yrs_college: 4,
                tuition_hike: 5.0,
                interest_rate: 9.0,
                expected_salary: 50000.0,
                cost_of_living: 2500.0,
            },
            results: None,
        }
    }

    fn update(&mut self, _ctx: &Context<Self>, msg: Self::Message) -> bool {
        match msg {
            Msg::UpdateField(field, value) => {
                match field.as_str() {
                    "current_tuition" => self.form_data.current_tuition = value.parse().unwrap_or(0.0),
                    "tuition_period" => self.form_data.tuition_period = value,
                    "semesters_per_year" => self.form_data.semesters_per_year = value.parse().unwrap_or(2),
                    "number_yrs_college" => self.form_data.number_yrs_college = value.parse().unwrap_or(4),
                    "tuition_hike" => self.form_data.tuition_hike = value.parse().unwrap_or(0.0),
                    "interest_rate" => self.form_data.interest_rate = value.parse().unwrap_or(0.0),
                    "expected_salary" => self.form_data.expected_salary = value.parse().unwrap_or(0.0),
                    "cost_of_living" => self.form_data.cost_of_living = value.parse().unwrap_or(0.0),
                    _ => return false,
                }
                true
            }
            Msg::Calculate => {
                self.calculate_results();
                true
            }
        }
    }
	// ToDo put in night mode or have toggle
	// have table have highlighted results
	// add estimated financial summary - monthly take home pay after taxes/fica, est. cost of living, lowest term payment, remaining money
    fn view(&self, ctx: &Context<Self>) -> Html {
        html! {
            <div class="container">
                <div class="calculator-grid">
                    { self.render_form(ctx) }
                    { self.render_results() }
                </div>
            </div>
        }
    }
}

impl LoanCalculator {
    fn calculate_monthly_payment(principal: f64, annual_rate: f64, years: i32) -> f64 {
        let r = annual_rate / 12.0;
        let n = years as f64 * 12.0;
        
        if r == 0.0 {
            return principal / n;
        }
        
        principal * (r * (1.0 + r).powf(n)) / ((1.0 + r).powf(n) - 1.0)
    }

    fn calculate_total_tuition(
        base_tuition: f64,
        is_per_semester: bool,
        semesters_per_year: i32,
        yearly_increase: f64,
        num_yrs_college: i32
    ) -> f64 {
        let mut total = 0.0;
        let mut yearly_tuition = base_tuition * if is_per_semester {
            semesters_per_year as f64
        } else {
            1.0
        };

        for _ in 0..num_yrs_college {
            total += yearly_tuition;
            yearly_tuition *= 1.0 + yearly_increase;
        }
        total
    }

    fn estimate_takehome_pay(gross_salary: f64) -> f64 {
        let tax_rate = if gross_salary <= 11600.0 { 0.10 }
            else if gross_salary <= 47150.0 { 0.12 }
            else if gross_salary <= 100525.0 { 0.22 }
            else if gross_salary <= 191950.0 { 0.24 }
            else { 0.32 };

        let taxable_income = (gross_salary - 13850.0).max(0.0);
        let taxes = taxable_income * tax_rate;
        let fica = gross_salary * 0.0765;
        let annual_takehome = gross_salary - taxes - fica;
        
        annual_takehome / 12.0
    }

    fn get_color_for_ratio(ratio: f64) -> &'static str {
        if ratio <= 15.0 { "bg-green" }
        else if ratio <= 33.333 { "bg-yellow" }
        else if ratio <= 50.0 { "bg-orange" }
        else { "bg-red" }
    }

    fn calculate_results(&mut self) {
        let is_per_semester = self.form_data.tuition_period == "Per Semester";
        let total_tuition = Self::calculate_total_tuition(
            self.form_data.current_tuition,
            is_per_semester,
            self.form_data.semesters_per_year,
            self.form_data.tuition_hike / 100.0,
            self.form_data.number_yrs_college
        );

        let monthly_takehome = Self::estimate_takehome_pay(self.form_data.expected_salary);
        let loan_terms = vec![5, 10, 15, 20, 25, 30];
        
        let payments: Vec<PaymentResult> = loan_terms
            .iter()
            .map(|&years| {
                let monthly_payment = Self::calculate_monthly_payment(
                    total_tuition,
                    self.form_data.interest_rate / 100.0,
                    years
                );
                PaymentResult {
                    term: years,
                    monthly_payment,
                    percent_of_takehome: (monthly_payment / monthly_takehome) * 100.0,
                }
            })
            .collect();

        let lowest_payment = payments
            .iter()
            .map(|p| p.monthly_payment)
            .min_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(0.0);

        let remaining_money = monthly_takehome - lowest_payment - self.form_data.cost_of_living;

        self.results = Some(CalculationResults {
            total_tuition,
            monthly_takehome,
            payments,
            lowest_payment,
            remaining_money,
        });
    }

    fn render_form(&self, ctx: &Context<Self>) -> Html {
        let link = ctx.link();
        
        html! {
            <div class="form-container">
                <h2>{ "Student Loan Calculator" }</h2>
                <div class="form-group">
                    <label>{ "Current Tuition Amount" }</label>
                    <input
                        type="number"
                        value={ self.form_data.current_tuition.to_string() }
                        onchange={ link.callback(|e: Event| {
                            let input = e.target_unchecked_into::<HtmlInputElement>();
                            Msg::UpdateField("current_tuition".to_string(), input.value())
                        })}
                    />
                </div>
                // ToDo Add other form fields 
                <button onclick={ link.callback(|_| Msg::Calculate) }>
                    { "Calculate" }
                </button>
            </div>
        }
    }

    fn render_results(&self) -> Html {
        if let Some(results) = &self.results {
            html! {
                <div class="results-container">
                    <h3>{ "Results" }</h3>
                    <p>{ format!("Total tuition cost: ${:.2}", results.total_tuition) }</p>
                    <p>{ format!("Monthly take-home pay: ${:.2}", results.monthly_takehome) }</p>
                    
                    <table class="payments-table">
                        <thead>
                            <tr>
                                <th>{ "Term (Years)" }</th>
                                <th>{ "Monthly Payment" }</th>
                                <th>{ "% of Take-Home" }</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                results.payments.iter().map(|payment| {
                                    let color_class = Self::get_color_for_ratio(payment.percent_of_takehome);
                                    html! {
                                        <tr class={ color_class }>
                                            <td>{ payment.term }</td>
                                            <td>{ format!("${:.2}", payment.monthly_payment) }</td>
                                            <td>{ format!("{:.1}%", payment.percent_of_takehome) }</td>
                                        </tr>
                                    }
                                }).collect::<Html>()
                            }
                        </tbody>
                    </table>

                    <div class="financial-summary">
                        {
                            if results.remaining_money < 0.0 {
                                html! { <div class="alert alert-error">
                                    { "Warning: Your estimated expenses exceed your take-home pay!" }
                                </div> }
                            } else if results.remaining_money < 500.0 {
                                html! { <div class="alert alert-warning">
                                    { "Caution: Your remaining monthly income is very low!" }
                                </div> }
                            } else if results.remaining_money < 1000.0 {
                                html! { <div class="alert alert-warning">
                                    { "Caution: Your remaining monthly income is low!" }
                                </div> }
                            } else {
                                html! { <div class="alert alert-success">
                                    { "Your financial plan appears sustainable!" }
                                </div> }
                            }
                        }
                    </div>
                </div>
            }
        } else {
            html! {}
        }
    }
}

fn main() {
    wasm_logger::init(wasm_logger::Config::default());
    yew::Renderer::<LoanCalculator>::new().render();
}
