import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'

class SearchBar extends React.Component {
	render() {
		return (
			<div class="wrap">
				<div class="search">
					<input type="text" class="searchTerm" placeholder="Search for a building"/>
					<button type="submit" class="searchButton">
						<i class="fa fa-search"></i>
					</button>
				</div>
			</div>
		);
	}
}

function TitleBar() {
	return (
		<div className='opaqueContainer'>
			<div className='imgtitle'/>
			<div className='textCenter'>
				<h1 className='algerian'>UNIGE Crowd Detector</h1>
			</div>
			<div className='imgtitle'/>
		</div>
		
	);
}

class MainPage extends React.Component {
	render() {
		return (
			<>
				<TitleBar />
				<SearchBar />
			</>
		);
	}
}

ReactDOM.render(
	<MainPage />,
	document.getElementById('root')
);
