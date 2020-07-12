
import React, {Component} from "react";
import aisData from "./searchAisDatas-import.json";
import axios from "axios";

const aisdata = aisData
console.log(aisData);

// deze haalt de data uit de DB en zet het om in JSON format (ga useSWR of axios gebruiken)
// const fetcher = (...args) => fetch(...args).then(response => response.json());
// use hooks om de data via de rest op te halen met een timer :-)) interval kan worden gezet voor de fetcher.
// const url ="http://localhost:3000/api/schips";
// const { data, error } = useSwr([url], { fetcher });
// const schips = data && !error ? data : [];

class searchAisDatas extends Component {
    constructor(props) {
        super(props)

        this.state = {
            posts: [],
            errorMsg: ''
        }
    }

    componentDidMount() {
        axios
            .get("/api/aisdatas/")
            .then(response => {
                console.log(aisdata);
                console.log(response);
                this.setState({ posts: response.data })
            })
            .catch(error => {
                console.log(error);
                this.setState({errorMsg: 'Error retrieving data'})
            })
    }

    render() {
        const { posts, errorMsg } = this.state
        return (
            <div>
            Lijst van alle posts
        console.log(posts);
        {posts.length ? posts.map(post =>
            <div key={post.aisnummer}>
            {[post.aisnummer, post.klasse, post.naamschip, post.naamschipper, post.naamschip, post.naamschipper]}}
    </div>)
    : null}
    {errorMsg ? <div>{errorMsg}</div> : null}
    </div>
    )
}
}

export default searchAisDatas



