import unittest
import HTMLTestRunner
import os
from test_search import SearchTests
from test_login_button import LoginButtonTests
from test_signup_button import SignupButtonTests
from test_log_then_sign_button import LogThenSignButtonTests
from test_create_patient_account_button import CreatePatientAccountButtonTests
from test_create_doctor_account_button import CreateDoctorAccountButtonTests
from test_successfully_login import SuccessfullyLogInTests
from test_forum_button import ForumButtonTests
from test_search_comment import CommentSearchTests
from test_successfully_leave_comment import SuccessfullyLeaveComment
from test_successfully_make_post import SuccessfullyMakePost
from test_search_post import PostSearchTests
from test_successfully_make_appointment import SuccessfullyMakeAppiontment
from test_successfully_make_diagnosis import SuccessfullyMakeDiagnosis
from test_successfully_rate import SuccessfullyRate
# get the directory path to output report file
dir = os.getcwd()
# get all tests from SearchProductTest and HomePageTest class
#search_tests = unittest.TestLoader().loadTestsFromTestCase(SearchTests)
login_button_tests = unittest.TestLoader().loadTestsFromTestCase(LoginButtonTests)
signup_button_tests = unittest.TestLoader().loadTestsFromTestCase(SignupButtonTests)
log_then_sign_button_tests = unittest.TestLoader().loadTestsFromTestCase(LogThenSignButtonTests)
create_patient_account_button_tests = unittest.TestLoader().loadTestsFromTestCase(CreatePatientAccountButtonTests)
create_doctor_account_button_tests = unittest.TestLoader().loadTestsFromTestCase(CreateDoctorAccountButtonTests)
successfully_login_tests = unittest.TestLoader().loadTestsFromTestCase(SuccessfullyLogInTests)
forum_button_tests = unittest.TestLoader().loadTestsFromTestCase(ForumButtonTests)
comment_search_tests = unittest.TestLoader().loadTestsFromTestCase(CommentSearchTests)
successfully_leave_comment = unittest.TestLoader().loadTestsFromTestCase(SuccessfullyLeaveComment)
successfully_make_post = unittest.TestLoader().loadTestsFromTestCase(SuccessfullyMakePost)
post_search_tests = unittest.TestLoader().loadTestsFromTestCase(PostSearchTests)
successfully_make_appointment = unittest.TestLoader().loadTestsFromTestCase(SuccessfullyMakeAppiontment)
successfully_make_diagnosis = unittest.TestLoader().loadTestsFromTestCase(SuccessfullyMakeDiagnosis)
successfully_rate = unittest.TestLoader().loadTestsFromTestCase(SuccessfullyRate)
# create a test suite combining search_test and home_pa ge_test
tests = unittest.TestSuite([login_button_tests, signup_button_tests, log_then_sign_button_tests, create_patient_account_button_tests, create_doctor_account_button_tests, successfully_login_tests, forum_button_tests, comment_search_tests,successfully_make_post, post_search_tests, successfully_make_appointment, successfully_make_diagnosis, successfully_rate, successfully_leave_comment])
# open the report file
outfile = open(dir + "/TestReport.html", "w")
# configure HTMLTestRunner options
runner = HTMLTestRunner.HTMLTestRunner(stream=outfile,title='Test Report', description='Tests')
# run the suite using HTMLTestRunner
runner.run(tests)