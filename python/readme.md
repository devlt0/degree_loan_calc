## Python + Streamlit version of degree loan calculator

[See Python + Streamlit version in action here](https://degree-loan-feasibility.streamlit.app/)
<br>
Currently the estimator does not account for things such as lay offs, time between jobs, raises/promotions, salary increases.
<br>
Does account for;<br>
tuition increase between years,<br>
interest on loan,<br>
various term lengths,<br>
cost of living,<br>
expected salary upon graduation<br>
<br>
<br>
Ideally would add button to type in chosen profession and provide rough estimate of entry level salary vs currently user provided.
<br>
<br>
<br>
<br>
<br>

To run python version locally;<br>
-checkout repo<br>
-naviagate to ./degree_loan_calc/python/<br>
-[Optional / Recommended] 
Create a virtual environment<br><br>
On macOS/Linux<br>
python3 -m venv venv<br>
source venv/bin/activate<br>
<br><br>
On Windows<br>
python -m venv venv<br>
.\venv\Scripts\activate<br>
<br>
-open terminal/cmd prompt inside ./degree_loan_calc/python/<br>
-type "pip install -r requirements.txt" then hit Enter/Return to ensure project dependencies are installed<br>
-type "streamlit run degree_calc.py" then hit Enter/Return to start <br>
-open browser to http://localhost:8501 (streamlit default local port) or whatever url terminal provides

