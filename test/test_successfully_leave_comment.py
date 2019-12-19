import os
import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select


class SuccessfullyLeaveComment(unittest.TestCase):
	
	def setUp(self):
		dire = os.path.dirname(os.path.abspath(__file__))
		chrome_driver_path = dire + "/chromedriver"
		self.driver = webdriver.Chrome(chrome_driver_path)

	def test_search(self):
		
		driver = self.driver
		driver.get("http://localhost:3000")
		login_button = driver.find_element_by_id("clicklog")
		login_button.click()
		select_type = Select(driver.find_element_by_name('usertype'))
		select_type.select_by_visible_text("Patient")
		input_email_box = driver.find_element_by_name("Email")
		input_email_box.clear()
		input_email_box.send_keys("wf541@nyu.edu")
		input_password_box = driver.find_element_by_name("Password")
		input_password_box.clear()
		input_password_box.send_keys("12345678")
		confirm_button = log_then_sign_button = driver.find_element_by_xpath('//button[@type="submit"]')
		confirm_button.click()
		forum_button = driver.find_element_by_id("forum-button")
		forum_button.click()
		post_title = driver.find_element_by_id('post-title')
		post_title.click()
		comment_input = driver.find_element_by_name("comment")
		comment_input.clear()
		comment_input.send_keys("Test from Selenium")
		comment_input.send_keys(Keys.ENTER)

		
		assert "Test from Selenium" in driver.page_source
	

	def tearDown(self):
		self.driver.close()

if __name__ == '__main__':
	unittest.main()