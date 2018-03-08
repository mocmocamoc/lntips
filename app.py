from flask import Flask, render_template, jsonify, request
import os
import random
import string
import lightning

app = Flask(__name__)
lnClient = lightning.LightningRpc(os.path.expanduser("~/.lightning/lightning-rpc"))

@app.route("/")
def home():
    return render_template("lntips.html")
    
@app.route("/getinvoice")
def getInvoice():
    value = request.args.get("value")
    label = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
    invoice = lnClient.invoice(value, label, "Donation to aspinall.io")
    return jsonify({"payment_request": invoice["bolt11"], "payment_hash": invoice["payment_hash"]})

@app.route("/invoicestatus")
def getInvoiceStatus():
    rhash = request.args.get("rhash")
    if not rhash:
        return jsonify(False)
    invoices = lnClient.listinvoices()["invoices"]
    invMatch = [i for i in invoices if i["payment_hash"] == rhash]
    if invMatch:
        status = invMatch[0]["status"]
        if status == "paid":
            return jsonify(True)
        else:
            return jsonify(False)
    else:
        return jsonify(False)
    
def main():
    app.run()
    
if __name__ == "__main__":
    main()
