import os
import unittest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select


class CommentSearchTests(unittest.TestCase):
	
	def setUp(self):
		dire = os.path.dirname(os.path.abspath(__file__))
		chrome_driver_path = dire + "/chromedriver"
		self.driver = webdriver.Chrome(chrome_driver_path)

	def test_search(self):
		
		driver = self.driver
		driver.get("http://localhost:3000")
		forum_button = driver.find_element_by_id("forum-button")
		forum_button.click()
		post_title = driver.find_element_by_id('post-title')
		post_title.click()
		input_search_box = driver.find_element_by_name("option")
		input_search_box.clear()
		input_search_box.send_keys("Hello")
		input_search_box.send_keys(Keys.ENTER)

		self.assertNotIn("Cheryl Feng", driver.page_source)

		#assert "Cheryl Feng" not in driver.page_source
	

	def tearDown(self):
		self.driver.close()

if __name__ == '__main__':
	unittest.main()