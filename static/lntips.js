
const PaymentState = {
    PAYMENT_STATE_WAITING_FOR_INPUT: 'PAYMENT_STATE_WAITING_FOR_INPUT',
    PAYMENT_STATE_WAITING_FOR_INVOICE: 'PAYMENT_STATE_WAITING_FOR_INVOICE',
    PAYMENT_STATE_WAITING_FOR_PAYMENT: 'PAYMENT_STATE_WAITING_FOR_PAYMENT',
    PAYMENT_STATE_COMPLETED: 'PAYMENT_STATE_COMPLETED',
    PAYMENT_STATE_ERROR: 'PAYMENT_STATE_ERROR',
}

class LNTips extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            paymentState: PaymentState.PAYMENT_STATE_WAITING_FOR_INPUT,
            value: 0,
            invoice: '',
            rhash: '',
            error: '',
            copied: false
        };
    }

    onCreateInvoice(event)
    {
        var value = parseInt(this.state.value);

        axios.get('/getinvoice', {
            params: {
                value: value
            }
        }).then(result => {
            this.setState({
                paymentState: PaymentState.PAYMENT_STATE_WAITING_FOR_PAYMENT,
                invoice: result.data.payment_request,
                rhash: result.data.payment_hash
            });

            // Poll for completed payment
            this.WaitForPayment();
        }).catch(error => {
            this.setState({
                paymentState: PaymentState.PAYMENT_STATE_ERROR,
                error: error.message
            })
        });
    }

    WaitForPayment()
    {
        axios.get('/invoicestatus', {
            params: {
                rhash: this.state.rhash
            }
        }).then(result => {
            if (JSON.parse(result.data) == true)
                this.setState({paymentState: PaymentState.PAYMENT_STATE_COMPLETED});
            else
                setTimeout(() => this.WaitForPayment(), 2000);
        }).catch(error => {
            this.setState({
                paymentState: PaymentState.PAYMENT_STATE_ERROR,
                error: error.message
            })
        });
    }

    onValueChange(event)
    {
        this.setState({
            value: event.target.value
        });
    }
    
    render()
    {
        var h = React.createElement;
        switch (this.state.paymentState)
        {
            case PaymentState.PAYMENT_STATE_WAITING_FOR_INPUT:
                return h("span", null, h("input", {placeholder: "amount (satoshis)", onChange: event => this.onValueChange(event)}), h("button", {onClick: event => this.onCreateInvoice(event)}, "Get invoice"));
            case PaymentState.PAYMENT_STATE_WAITING_FOR_PAYMENT:
                return h('span', null, "BOLT11 invoice:", h("br"), h("textarea", {rows: 4, cols:80}, `${ this.state.invoice }`), h("br"), h(CopyToClipboard, {text: `${this.state.invoice}`, onCopy: event => this.setState({copied: true})}, h("button", null, this.state.copied ? "Copied" : "Copy")));
            case PaymentState.PAYMENT_STATE_COMPLETED:
                return h("span", null, "Payment received, thank you!");
            case PaymentState.PAYMENT_STATE_ERROR:
                return h("span", null, `Error: ${this.state.error}`, h("br"), h("a", {href: "javascript:void(0)", onClick: event => this.setState({paymentState: PaymentState.PAYMENT_STATE_WAITING_FOR_INPUT})}, "Retry"));
        }
    }
}
