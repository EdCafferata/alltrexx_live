import React from "react";

export default function TopBar() {
    return (
        <div>
            <div className="navbar">
                <a className="active" href="/"><i className="fa fa-fw fa-home"></i>  Home</a>
                <a href="/searchschip"><i className="fa fa-fw fa-search"></i>  Search Schip</a>
                <a href="/searchaisdatas"><i className="fa fa-fw fa-search"></i>  Search Track</a>
                <a href="mailto:info@rondeomnoordholland.nl"><i className="fa fa-fw fa-envelope"></i>   Contact</a>
                <a href="/login"><i className="fa fa-fw fa-user"></i>  login   </a>
            </div>
        </div>
    );
}
