import os
from abc import ABC, abstractmethod
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

class Interfaz_Representacion(ABC):

    @abstractmethod
    def cargarMapaInstante(self, instante, listaEstaciones=None, accion=None, tipo=None):
        pass

    @abstractmethod
    def getFichero(self):
        pass

    @abstractmethod
    def getInstanciasMax(self):
        pass

    def _build_driver(self, headless: bool = True):
        opts = Options()

        if headless:
            # Works on newer Chrome/Chromium; if it fails, switch to "--headless"
            opts.add_argument("--headless=new")

        # Required in Docker
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")

        # Optional stability
        opts.add_argument("--window-size=3000,1000")

        # Get paths from env (set in docker-compose), fallback to Debian defaults
        chrome_binary = os.getenv("CHROME_BIN", "/usr/bin/chromium")
        chromedriver_path = os.getenv("CHROMEDRIVER_PATH", "/usr/bin/chromedriver")

        # Force Selenium to use system Chromium + system chromedriver
        opts.binary_location = chrome_binary
        service = Service(executable_path=chromedriver_path)

        return webdriver.Chrome(service=service, options=opts)

    def realizarFoto(self, rutaSalida: str):
        driver = self._build_driver(headless=True)

        try:
            driver.get("file://" + self.getFichero())
            driver.save_screenshot(rutaSalida)
        finally:
            driver.quit()
