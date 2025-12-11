from abc import ABC, abstractmethod
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

#Clase interfaz
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

    def _build_driver(self, headless: bool = True, chromedriver_path: str = None, chrome_binary: str = None):
        opts = Options()
        # modern headless flag recommended for current Chrome
        if headless:
            opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--disable-dev-shm-usage")

        # On macOS, if Chrome isn’t found automatically, you can set:
        # chrome_binary = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        if chrome_binary:
            opts.binary_location = chrome_binary  # optional, only if needed [macOS]

        if chromedriver_path:
            # Use an explicit chromedriver (pinned/manual)
            service = Service(chromedriver_path)
            return webdriver.Chrome(service=service, options=opts)
        else:
            # Let Selenium Manager resolve the driver automatically
            return webdriver.Chrome(options=opts)

    def realizarFoto(self, rutaSalida: str):
        # If you manually installed chromedriver, pass its path here; otherwise leave as None:
        # driver = self._build_driver(headless=True, chromedriver_path="/usr/local/bin/chromedriver")
        driver = self._build_driver(headless=True)

        try:
            driver.set_window_size(3000, 1000)  # choose a resolution
            driver.get("file://" + self.getFichero())
            driver.refresh()
            driver.save_screenshot(rutaSalida)
        finally:
            driver.quit()
